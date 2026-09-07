# Phase B — GIS Digital Twin: architecture and data model

**Status: design only. Nothing here is implemented.**
Implementation is blocked until Module 3 has been executed against a real SQL
Server and frozen. See §10.

---

## 0. The decision that has to be made first

Everything below depends on one choice that is expensive to reverse: **which
coordinate system the authoritative geometry lives in.** Getting this wrong is
not a bug you patch later, it is a re-survey.

SQL Server offers two spatial types and they behave differently:

| | `geography` | `geometry` |
|---|---|---|
| Model | ellipsoidal (round earth) | planar (flat) |
| `STArea()` at SRID 4326 | square **metres** — correct | square **degrees** — meaningless |
| `STDistance()` | metres | coordinate units |
| Spatial index | no bounding box needed | requires an explicit bounding box |
| Ring orientation | matters; a wrongly-wound polygon means "everything except this plot" | ignored |

**Recommendation: store the authoritative boundary as `geometry` in a projected
CRS — EPSG:32644 (UTM zone 44N), which covers Hyderabad.**

Reasons, in order of weight:

1. **It is what the surveyor delivers.** DWG/DXF from an approved HMDA layout is
   already planar, in metres, tied to ground control points. Storing it in 4326
   means reprojecting on import and again on every area calculation, and every
   reprojection is a chance to lose the survey's precision.
2. **Area and distance are exact, in metres.** `STArea()` returns square metres
   directly. Plot extents are legal quantities printed on agreements; they
   should not be the output of a datum transformation.
3. **Ring orientation is not a footgun.** `geography` treats an incorrectly
   wound polygon as its own complement — a 267 sq yd plot silently becomes the
   entire planet minus 267 sq yd. This is the most common way spatial data goes
   wrong, and `geometry` is immune to it.

Carry a **second, derived** `geography` column in SRID 4326 for map serving and
"distance to the ORR exit" queries against external landmarks. It is a
projection of the authoritative column, never edited directly.

```
Boundary     geometry(SRID 32644)   -- authoritative, from survey, metres
BoundaryGeo  geography(SRID 4326)   -- derived, for tiles and landmark queries
```

**Open question for the surveyor, before any data is loaded:** confirm the
layout's ground control points and the datum they were captured in (WGS84 vs a
local grid). Without control points, DWG geometry is *relative* — it will look
correct and sit tens of metres off satellite imagery, which is worse than no
map, because it is confidently wrong.

---

## 1. Entity relationships

```
                            Project
                               │
              ┌────────────────┼────────────────┐
              │                │                │
            Phase        SpatialAsset      LayoutDocument
              │        (roads, parks,      (approved PDF,
            Sector      utilities, gates,   DWG, control pts)
              │         clubhouse, trees)
             Road
              │
              ▼
            ┌──────┐
            │ Plot │◄──────── the spine: everything below references PlotId
            └──┬───┘
               │
   ┌───────────┼───────────┬──────────────┬─────────────────┐
   │           │           │              │                 │
PlotStatus  PlotPrice   Booking      Construction      PlotMedia
 History     History        │           History        (drone, 360,
(append-    (append-        │          (append-         gallery)
  only)       only)         │            only)
                            │
              ┌─────────────┼─────────────┐
              │             │             │
          Customer       Payment      Agreement
              │             │             │
              │       PaymentHistory  Registration
              │       (append-only)        │
              │                     RegistrationHistory
       CustomerPortalAccess          (append-only)
```

Every mutable business event has an append-only history table beside it. This
mirrors the pattern already proven in Module 3's `LeadActivities` and
`AuditLog`, including the `INSTEAD OF UPDATE, DELETE` triggers.

---

## 2. Plots — facts only, no state

```sql
CREATE TABLE dbo.Plots (
    PlotId          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    ProjectId       UNIQUEIDENTIFIER NOT NULL,
    PhaseId         UNIQUEIDENTIFIER NULL,
    SectorId        UNIQUEIDENTIFIER NULL,
    RoadId          UNIQUEIDENTIFIER NULL,

    PlotNumber      NVARCHAR(24)  NOT NULL,   -- '142', '17-A'
    SurveyNumber    NVARCHAR(64)  NULL,       -- '217/A'
    HmdaReference   NVARCHAR(64)  NULL,
    LayoutReference NVARCHAR(64)  NULL,

    Boundary        GEOMETRY      NOT NULL,   -- SRID 32644, authoritative
    BoundaryGeo     GEOGRAPHY     NULL,       -- SRID 4326, derived on write

    RoadWidthFt     DECIMAL(5,1)  NULL,       -- attribute of the abutting road
    ElevationM      DECIMAL(6,2)  NULL,       -- survey benchmark, not derived

    CreatedAt       DATETIME2(3)  NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedBy       UNIQUEIDENTIFIER NULL,
    UpdatedAt       DATETIME2(3)  NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedBy       UNIQUEIDENTIFIER NULL,

    CONSTRAINT PK_Plots PRIMARY KEY CLUSTERED (PlotId),
    CONSTRAINT UQ_Plots_Number UNIQUE (ProjectId, PlotNumber)
);
```

No `Status`. No `Price`. No `BookingId`. Those answer "what is true now", and
the correct source for that is the head of a history table, exposed as a view.

### 2.1 Derived attributes — and a SQL Server constraint worth knowing

Area, centroid, corner-plot and lat/long are computable from `Boundary`. Storing
them independently guarantees drift, and a plot advertised as east-facing that
is not is a legal exposure, not a data-quality one.

**However — SQL Server will not let you persist or index a computed column
derived from a spatial method.** Spatial methods on the `geometry` CLR type are
deterministic but *imprecise* (floating point), and `PERSISTED` requires
precise. `STArea()`, `STCentroid()` and friends are therefore unavailable to
persisted computed columns and cannot be indexed.

Three workable options, in order of preference:

1. **Non-persisted computed column for correctness, maintained column for
   speed.** Declare `AreaSqM AS Boundary.STArea()` (always correct, not
   indexable) *and* a plain `AreaSqMIndexed DECIMAL(12,3)` written in the same
   transaction as the geometry, with a reconciliation job that flags divergence.
2. **Maintain derived values in an `INSTEAD OF INSERT, UPDATE` trigger,** so the
   application cannot write geometry without also writing its derivatives.
   Single source of truth, no reconciliation, at the cost of trigger logic.
3. **An indexed view.** The same imprecision restriction applies to the index,
   so this only helps non-indexed reads.

**Recommendation: option 2.** It makes the invariant impossible to violate —
the same reason the append-only triggers exist in Module 3. Confirm the exact
behaviour on the target SQL Server version during Phase A before committing.

**Facing is not derivable from the polygon alone.** It is a function of which
edge abuts the road, so it needs `RoadId` plus the road centreline geometry:
nearest-edge bearing, snapped to eight compass points. Compute once on import,
store it, and record *how* it was derived so a disputed facing can be rechecked.

### 2.2 Spatial indexes

```sql
-- geometry requires an explicit bounding box: the project envelope, padded
CREATE SPATIAL INDEX SIX_Plots_Boundary ON dbo.Plots (Boundary)
    USING GEOMETRY_AUTO_GRID
    WITH (BOUNDING_BOX = (xmin, ymin, xmax, ymax));

CREATE SPATIAL INDEX SIX_Plots_BoundaryGeo ON dbo.Plots (BoundaryGeo);
```

The bounding box must be recomputed if a project's envelope grows. Getting it
wrong does not produce wrong answers, it produces slow ones — the usual symptom
is a spatial query that silently ignores the index.

---

## 3. History tables

All follow one shape, all append-only, enforced by `INSTEAD OF UPDATE, DELETE`
triggers that `RAISERROR` and `ROLLBACK`.

```sql
CREATE TABLE dbo.PlotStatusHistory (
    HistoryId   UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    PlotId      UNIQUEIDENTIFIER NOT NULL,
    Status      VARCHAR(24)      NOT NULL,
    Reason      NVARCHAR(200)    NULL,
    Remarks     NVARCHAR(1000)   NULL,
    ChangedBy   UNIQUEIDENTIFIER NULL,
    ChangedAt   DATETIME2(3)     NOT NULL DEFAULT SYSUTCDATETIME(),
    Ip          VARCHAR(45)      NULL,
    UserAgent   NVARCHAR(400)    NULL,
    Channel     VARCHAR(12)      NULL,
    CONSTRAINT PK_PlotStatusHistory PRIMARY KEY (HistoryId),
    CONSTRAINT FK_PSH_Plot FOREIGN KEY (PlotId) REFERENCES dbo.Plots(PlotId)
);

CREATE TABLE dbo.PlotPriceHistory (
    PriceId          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    PlotId           UNIQUEIDENTIFIER NOT NULL,
    BasePricePerSqYd DECIMAL(14,2)    NOT NULL,
    PlcAmount        DECIMAL(14,2)    NOT NULL DEFAULT 0,  -- corner, park-facing
    DiscountAmount   DECIMAL(14,2)    NOT NULL DEFAULT 0,
    EffectiveFrom    DATETIME2(3)     NOT NULL,
    EffectiveTo      DATETIME2(3)     NULL,                -- NULL = current
    CreatedBy        UNIQUEIDENTIFIER NULL,
    CreatedAt        DATETIME2(3)     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_PlotPriceHistory PRIMARY KEY (PriceId)
);

-- at most one current price per plot
CREATE UNIQUE INDEX UX_Price_Current ON dbo.PlotPriceHistory (PlotId)
    WHERE EffectiveTo IS NULL;
```

Money is `DECIMAL(14,2)` throughout, never float. All timestamps UTC.

Current state is read through a view, never by scanning:

```sql
CREATE VIEW dbo.vPlotCurrent AS
SELECT p.PlotId, p.ProjectId, p.PlotNumber,
       s.Status, s.ChangedAt AS StatusSince,
       pr.BasePricePerSqYd, pr.PlcAmount, pr.DiscountAmount
FROM dbo.Plots p
OUTER APPLY (SELECT TOP 1 * FROM dbo.PlotStatusHistory h
             WHERE h.PlotId = p.PlotId ORDER BY h.ChangedAt DESC) s
OUTER APPLY (SELECT TOP 1 * FROM dbo.PlotPriceHistory q
             WHERE q.PlotId = p.PlotId AND q.EffectiveTo IS NULL) pr;
```

Supporting index: `(PlotId, ChangedAt DESC)` on `PlotStatusHistory`.

---

## 4. SpatialAssets — the rest of the township

```sql
CREATE TABLE dbo.SpatialAssets (
    AssetId     UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    ProjectId   UNIQUEIDENTIFIER NOT NULL,
    AssetType   VARCHAR(24)      NOT NULL,
    Name        NVARCHAR(120)    NULL,
    Geometry    GEOMETRY         NOT NULL,   -- SRID 32644
    GeometryGeo GEOGRAPHY        NULL,       -- SRID 4326, derived
    Properties  NVARCHAR(MAX)    NULL,       -- JSON, type-specific
    CreatedAt   DATETIME2(3)     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_SpatialAssets PRIMARY KEY (AssetId),
    CONSTRAINT CK_AssetType CHECK (AssetType IN (
        'ROAD','DRAIN','ELECTRIC','WATER','SEWER','STREETLIGHT',
        'PARK','CLUBHOUSE','GATE','TREE','AMENITY','BOUNDARY_WALL'))
);
```

`Properties` is JSON because the useful attributes genuinely differ by type — a
road has width and surface, a streetlight has pole height and lamp type.
Forcing them into shared columns produces a table that is mostly NULL. The CHECK
keeps the type vocabulary closed; the JSON stays open.

Roads are load-bearing rather than decorative: they are referenced by
`Plots.RoadId` and drive facing computation.

---

## 5. Booking state machine

```
  AVAILABLE ──reserve──► RESERVED ──token paid──► TOKEN_PAID
      ▲                     │                          │
      │                     │ expire / release         │ agreement signed
      │                     ▼                          ▼
      └──────────────── AVAILABLE                 AGREEMENT
                            ▲                          │
                            │ cancel                   │ registered
                            │                          ▼
                       CANCELLED ◄──cancel──────  REGISTERED
                                                       │ handover
                                                       ▼
                                                   COMPLETED
```

| From | Allowed to | Requires |
|---|---|---|
| `AVAILABLE` | `RESERVED`, `BLOCKED` | `inventory:hold` |
| `RESERVED` | `TOKEN_PAID`, `AVAILABLE`, `CANCELLED` | token receipt / manager |
| `TOKEN_PAID` | `AGREEMENT`, `CANCELLED` | signed agreement / refund path |
| `AGREEMENT` | `REGISTERED`, `CANCELLED` | registration receipt |
| `REGISTERED` | `COMPLETED` | handover checklist |
| `COMPLETED` | — | terminal |
| `CANCELLED` | `AVAILABLE` | `inventory:update`, with reason |
| `BLOCKED` | `AVAILABLE` | admin only |

**Enforced in two places, deliberately:**

1. **Service layer** — a `canTransition(from, to, role)` lookup, so the UI omits
   impossible actions and the API returns a clear 409.
2. **Database** — an `INSTEAD OF INSERT` trigger on `PlotStatusHistory` that
   reads the current head and rejects a disallowed pair. This makes an invalid
   transition *impossible* rather than *discouraged*, including from a direct
   SQL session or a future service that forgets the rule.

**`RESERVED` needs an expiry.** A hold with no clock is how inventory silently
disappears: `ExpiresAt DATETIME2(3)` on the booking, plus a scheduled job that
returns lapsed holds to `AVAILABLE` with `Reason = 'reservation expired'`. The
job writes history like any other actor, so an expiry is auditable.

**Concurrency.** Two salespeople reserving the same plot is the defining race of
this system, and it must be closed by a constraint rather than by careful code.

A conditional insert alone is **not sufficient**:

```sql
-- NOT ENOUGH on its own: under READ COMMITTED both transactions can read
-- 'AVAILABLE' in the subquery and both proceed. This narrows the window; it
-- does not close it.
INSERT INTO dbo.PlotStatusHistory (PlotId, Status, ...)
SELECT @PlotId, 'RESERVED', ...
WHERE (SELECT TOP 1 Status FROM dbo.PlotStatusHistory
       WHERE PlotId = @PlotId ORDER BY ChangedAt DESC) = 'AVAILABLE';
```

The invariant belongs in a filtered unique index on a dedicated reservations
table, where the engine enforces it whatever the isolation level, timing, or
calling service:

```sql
CREATE TABLE dbo.PlotReservations (
    ReservationId UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    PlotId        UNIQUEIDENTIFIER NOT NULL,
    CustomerId    UNIQUEIDENTIFIER NULL,
    HeldBy        UNIQUEIDENTIFIER NOT NULL,
    ExpiresAt     DATETIME2(3)     NOT NULL,
    ReleasedAt    DATETIME2(3)     NULL,      -- NULL = live hold
    ReleaseReason NVARCHAR(200)    NULL,
    CreatedAt     DATETIME2(3)     NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_PlotReservations PRIMARY KEY (ReservationId)
);

-- the actual guarantee: at most one live hold per plot
CREATE UNIQUE INDEX UX_Plot_ActiveHold ON dbo.PlotReservations (PlotId)
    WHERE ReleasedAt IS NULL;
```

The second reservation fails on a unique-key violation, which the service
translates into `409 { currentStatus }`. The conditional insert remains useful
as a fast pre-check that produces a clean error in the common case — but the
index is what makes the invariant true. Same reasoning as the dedup index on
`Leads (Phone, ProjectId) WHERE MergedIntoId IS NULL`: make the wrong state
unrepresentable rather than merely unlikely.

Reservation and its status-history row are written in one transaction, so a hold
can never exist without an audit trail.

---

## 6. API contracts (shape only — not implemented)

```
GET  /api/projects/:id/plots?bbox=&status=&facing=&minArea=&maxPrice=
     → GeoJSON FeatureCollection, geometry 4326, properties from vPlotCurrent

GET  /api/projects/:id/tiles/:z/:x/:y.mvt
     → vector tile, cached, ETag from MAX(UpdatedAt)

GET  /api/plots/:id
     → geometry, current status, current price, media, documents

POST /api/plots/:id/reserve      { customerId, expiresInHours }
     → 201 reservation, or 409 { currentStatus } if the race was lost

POST /api/plots/:id/status       { to, reason, remarks }
     → 200, or 422 { allowedTransitions: [...] } — never a silent no-op

GET  /api/projects/:id/assets?type=ROAD,PARK
     → GeoJSON base layers

GET  /api/plots/search?q=<natural language>
     → AI layer translates to a spatial query and returns the SQL it ran,
       so an operator can see what was actually asked
```

Every mutating endpoint writes history. Every state-reflecting response reads
`vPlotCurrent`, never a cached status column.

---

## 7. Map architecture

**MapLibre GL** for the township; Google Maps only for "Get Directions" and
Street View, where users have muscle memory. No vendor lock-in on the layer that
will be customised most.

```
SQL Server (geometry 32644)
      │ reproject on write
      ▼
BoundaryGeo (geography 4326)
      │ vector tiles, generated server-side
      ▼
  tiles ──cached, ETag──► MapLibre GL
                              │
                 ┌────────────┼────────────┐
              plots       roads/parks    labels
           (fill by       (base map)    (symbol)
            status)
```

Tiles are generated from the database rather than pre-baked, because status
changes hourly during a launch. Cache on an ETag derived from `MAX(UpdatedAt)`
per project, so a status change invalidates exactly the tiles that need it.

**Status colours** live in one place shared with the CRM design tokens — the
same seven colours in the map, the inventory table and the dashboard.

**Stage progression.** Stage 1 (MapLibre) is an *operations* tool: sales needs
clickable availability. Stage 2 (three.js, shadows, day/night) is a *marketing*
experience. Different users, different deadlines — they run in parallel rather
than in sequence. Stage 3 (Cesium, drone overlay) earns its cost only once drone
capture is routine.

---

## 8. Performance planning

| Concern | Approach | Budget |
|---|---|---|
| Plot polygons per project | vector tiles, not GeoJSON over the wire | < 150 KB/tile |
| Status changes during launch | ETag per project, tile invalidation | < 2 s to reflect |
| `vPlotCurrent` over 2,000 plots | index `(PlotId, ChangedAt DESC)` | < 50 ms |
| Spatial containment queries | spatial index + correct bounding box | < 100 ms |
| Map first paint | base layers first, plots streamed after | LCP < 2.5 s |
| Hover / selection | GPU feature-state, no React re-render | 60 fps |

The last row mirrors the film engine already built: selection state belongs in a
ref and a MapLibre `setFeatureState` call, not in React state. Re-rendering a
component tree on mousemove across 2,000 polygons will not hold 60 fps, and the
existing scroll engine is the proof that the imperative path works.

---

## 9. UI wireframes (structure, not visual design)

**Inventory map — operator view**

```
┌────────────────────────────────────────────────────────────┐
│ Sanctuary ▾   Phase 1 ▾       [search: "east corner <40L"] │
├───────────────┬────────────────────────────────────────────┤
│ FILTERS       │                                            │
│ ☐ Available   │            MAP CANVAS                      │
│ ☐ Reserved    │       plots shaded by status               │
│ ☐ Token paid  │       roads, parks, clubhouse              │
│ ─────────     │       hover → tooltip                      │
│ Facing  ▾     │       click → right panel                  │
│ Area    ▭▭    │                                            │
│ Price   ▭▭    │   [layers ▾] [satellite] [reset view]      │
├───────────────┴────────────────────────────────────────────┤
│ 412 plots · 118 available · 37 reserved                    │
└────────────────────────────────────────────────────────────┘
```

Selecting a plot opens a right panel: number, extent, facing, current price,
status with its history, documents, media, and the transitions the viewer's role
actually permits. Impossible transitions are absent, not disabled.

**Customer view** is the same map with operator chrome removed — availability
and price only, no internal status, no history, one reserve action.

---

## 10. Gate

```
crm/.env  ←  real SQL Server credentials
    ↓
npm run db:setup
    ↓
npm run verify:module3 --live --force
    ↓
report shows 0 FAIL and 0 NOT TESTED on critical paths
    ↓
freeze Module 3, tag the release
    ↓
Phase B implementation begins
```

Two things the Phase A run should confirm empirically, because they change the
design above:

1. Whether the target SQL Server version permits the derived-column approach in
   §2.1 as expected, and which of the three options it forces.
2. The actual `@@VERSION` — spatial function availability and `DATETRUNC`-era
   syntax differ across versions, and the reports module already avoids
   2022-only functions on that basis.

**Data collection should start immediately, in parallel with Phase A** —
approved layout, DWG/DXF, survey control points and their datum, road
centrelines, utility runs, amenity polygons. That work is surveying, not
software, and it is the long pole. Nothing downstream is real until the polygons
exist.
