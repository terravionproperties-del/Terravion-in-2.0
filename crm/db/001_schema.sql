/* ═══════════════════════════════════════════════════════════════════════
   Terravion OS — Microsoft SQL Server schema
   Run once against the target database:
       sqlcmd -S <server> -d TerravionCRM -i db/001_schema.sql
   Idempotent: safe to re-run.

   Conventions
     · Keys are UNIQUEIDENTIFIER with NEWSEQUENTIALID(). Sequential GUIDs keep
       the clustered index from fragmenting the way NEWID() does, while staying
       safe to expose in a URL.
     · All timestamps are UTC via SYSUTCDATETIME(), typed DATETIME2(3).
       Local time is a presentation concern, never a storage one.
     · Money is DECIMAL(14,2). Never FLOAT — a ledger that rounds loses money.
     · Enumerations are VARCHAR with CHECK constraints rather than lookup
       tables: readable in raw queries, indexable, and enforced by the engine.
   ═══════════════════════════════════════════════════════════════════════ */

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/* ─────────────────────────────────────────────────────────── Users ───── */
IF OBJECT_ID('dbo.Users', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        Id             UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Users_Id DEFAULT NEWSEQUENTIALID(),
        Email          NVARCHAR(256)    NOT NULL,
        Name           NVARCHAR(200)    NOT NULL,
        Phone          NVARCHAR(20)     NULL,
        PasswordHash   NVARCHAR(512)    NULL,   -- Argon2id
        Role           VARCHAR(24)      NOT NULL CONSTRAINT DF_Users_Role DEFAULT 'SALES_EXECUTIVE',
        IsActive       BIT              NOT NULL CONSTRAINT DF_Users_IsActive DEFAULT 1,
        LastLoginAt    DATETIME2(3)     NULL,
        CreatedAt      DATETIME2(3)     NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt      DATETIME2(3)     NOT NULL CONSTRAINT DF_Users_UpdatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_Users PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT UQ_Users_Email UNIQUE (Email),
        CONSTRAINT CK_Users_Role CHECK (Role IN
            ('ADMIN','SALES_MANAGER','SALES_EXECUTIVE','TELECALLER','MARKETING',
             'FINANCE','BROKER','SUPPORT','CUSTOMER'))
    );
END
GO

/* ──────────────────────────────────────────────────────── Projects ───── */
IF OBJECT_ID('dbo.Projects', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Projects (
        Id          UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Projects_Id DEFAULT NEWSEQUENTIALID(),
        Slug        VARCHAR(80)      NOT NULL,
        Name        NVARCHAR(160)    NOT NULL,
        Status      VARCHAR(20)      NOT NULL CONSTRAINT DF_Projects_Status DEFAULT 'SELLING',
        Approval    NVARCHAR(80)     NULL,
        ReraNumber  NVARCHAR(80)     NULL,
        Location    NVARCHAR(300)    NULL,
        TotalAcres  DECIMAL(8,2)     NULL,
        CreatedAt   DATETIME2(3)     NOT NULL CONSTRAINT DF_Projects_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_Projects PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT UQ_Projects_Slug UNIQUE (Slug),
        CONSTRAINT CK_Projects_Status CHECK (Status IN ('PRE_LAUNCH','SELLING','SOLD_OUT','COMPLETED'))
    );
END
GO

/* ─────────────────────────────────────────────────────────── Leads ───── */
IF OBJECT_ID('dbo.Leads', 'U') IS NULL
BEGIN
    CREATE SEQUENCE dbo.LeadSeq AS INT START WITH 1 INCREMENT BY 1;

    CREATE TABLE dbo.Leads (
        Id              UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Leads_Id DEFAULT NEWSEQUENTIALID(),
        Seq             INT              NOT NULL CONSTRAINT DF_Leads_Seq DEFAULT (NEXT VALUE FOR dbo.LeadSeq),
        -- Human-facing reference, derived so it can never drift from Seq.
        Reference       AS ('TVN-' + RIGHT('000000' + CAST(Seq AS VARCHAR(10)), 6)) PERSISTED,

        Name            NVARCHAR(200)    NOT NULL,
        Phone           VARCHAR(20)      NOT NULL,   -- E.164, normalised on write
        WhatsApp        VARCHAR(20)      NULL,
        Email           NVARCHAR(256)    NULL,

        BudgetMin       DECIMAL(14,2)    NULL,
        BudgetMax       DECIMAL(14,2)    NULL,
        PreferredFacing VARCHAR(12)      NULL,
        PlotSizeMin     DECIMAL(10,2)    NULL,
        PlotSizeMax     DECIMAL(10,2)    NULL,

        ProjectId       UNIQUEIDENTIFIER NULL,
        Source          VARCHAR(20)      NOT NULL CONSTRAINT DF_Leads_Source DEFAULT 'WEBSITE',
        Stage           VARCHAR(28)      NOT NULL CONSTRAINT DF_Leads_Stage DEFAULT 'NEW',
        Quality         VARCHAR(8)       NOT NULL CONSTRAINT DF_Leads_Quality DEFAULT 'WARM',
        Score           TINYINT          NOT NULL CONSTRAINT DF_Leads_Score DEFAULT 0,

        -- attribution, kept as first-class columns because reporting filters on them
        Campaign        NVARCHAR(200)    NULL,
        UtmSource       NVARCHAR(120)    NULL,
        UtmMedium       NVARCHAR(120)    NULL,
        UtmCampaign     NVARCHAR(200)    NULL,
        UtmTerm         NVARCHAR(200)    NULL,
        UtmContent      NVARCHAR(200)    NULL,
        Gclid           NVARCHAR(200)    NULL,
        Fbclid          NVARCHAR(200)    NULL,
        LandingPage     NVARCHAR(400)    NULL,
        Referrer        NVARCHAR(400)    NULL,

        OwnerId         UNIQUEIDENTIFIER NULL,
        Remarks         NVARCHAR(MAX)    NULL,
        LostReason      NVARCHAR(300)    NULL,

        NextFollowUpAt   DATETIME2(3)    NULL,
        FirstContactedAt DATETIME2(3)    NULL,
        LastActivityAt   DATETIME2(3)    NULL,
        -- a duplicate is never deleted; it points at the survivor
        MergedIntoId    UNIQUEIDENTIFIER NULL,

        CreatedAt       DATETIME2(3)     NOT NULL CONSTRAINT DF_Leads_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt       DATETIME2(3)     NOT NULL CONSTRAINT DF_Leads_UpdatedAt DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_Leads PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT FK_Leads_Project FOREIGN KEY (ProjectId) REFERENCES dbo.Projects(Id),
        CONSTRAINT FK_Leads_Owner   FOREIGN KEY (OwnerId)   REFERENCES dbo.Users(Id),
        CONSTRAINT FK_Leads_Merged  FOREIGN KEY (MergedIntoId) REFERENCES dbo.Leads(Id),
        CONSTRAINT CK_Leads_Source CHECK (Source IN
            ('WEBSITE','WHATSAPP','GOOGLE_ADS','META_ADS','ORGANIC','PHONE',
             'WALK_IN','BROKER','REFERRAL','MANUAL','PORTAL','OTHER')),
        CONSTRAINT CK_Leads_Stage CHECK (Stage IN
            ('NEW','CONTACTED','INTERESTED','SITE_VISIT_SCHEDULED','SITE_VISIT_COMPLETED',
             'NEGOTIATION','BOOKING_AMOUNT_PAID','AGREEMENT','REGISTRATION','COMPLETED',
             'LOST','CANCELLED')),
        CONSTRAINT CK_Leads_Quality CHECK (Quality IN ('HOT','WARM','COLD')),
        CONSTRAINT CK_Leads_Facing CHECK (PreferredFacing IS NULL OR PreferredFacing IN
            ('NORTH','SOUTH','EAST','WEST','NORTH_EAST','NORTH_WEST','SOUTH_EAST','SOUTH_WEST'))
    );
END
GO

/* Deduplication: one live lead per phone per project. The filter means merged
   duplicates drop out of the constraint rather than blocking future leads. */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_Leads_Phone_Project')
    CREATE UNIQUE INDEX UQ_Leads_Phone_Project
        ON dbo.Leads (Phone, ProjectId)
        WHERE MergedIntoId IS NULL;
GO

/* Search and list indexes. Every one backs a query the Leads screen actually
   issues; none is speculative. INCLUDE columns keep the list query covering. */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Leads_Phone')
    CREATE INDEX IX_Leads_Phone ON dbo.Leads (Phone) INCLUDE (Name, Stage, OwnerId);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Leads_Name')
    CREATE INDEX IX_Leads_Name ON dbo.Leads (Name) INCLUDE (Phone, Stage);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Leads_Stage_Created')
    CREATE INDEX IX_Leads_Stage_Created ON dbo.Leads (Stage, CreatedAt DESC)
        INCLUDE (Name, Phone, OwnerId, ProjectId, Source, Quality);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Leads_Owner_Created')
    CREATE INDEX IX_Leads_Owner_Created ON dbo.Leads (OwnerId, CreatedAt DESC)
        INCLUDE (Name, Phone, Stage);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Leads_Source_Created')
    CREATE INDEX IX_Leads_Source_Created ON dbo.Leads (Source, CreatedAt DESC);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Leads_FollowUp')
    CREATE INDEX IX_Leads_FollowUp ON dbo.Leads (NextFollowUpAt)
        WHERE NextFollowUpAt IS NOT NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Leads_CreatedAt')
    CREATE INDEX IX_Leads_CreatedAt ON dbo.Leads (CreatedAt DESC);
GO

/* ─────────────────────────────────────────────── Activities (timeline) ── */
IF OBJECT_ID('dbo.LeadActivities', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.LeadActivities (
        Id         UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Act_Id DEFAULT NEWSEQUENTIALID(),
        LeadId     UNIQUEIDENTIFIER NOT NULL,
        UserId     UNIQUEIDENTIFIER NULL,      -- NULL = system/automation
        Type       VARCHAR(24)      NOT NULL,
        Body       NVARCHAR(MAX)    NULL,
        MetaJson   NVARCHAR(MAX)    NULL,      -- duration, recording url, msg id
        OccurredAt DATETIME2(3)     NOT NULL CONSTRAINT DF_Act_OccurredAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_LeadActivities PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT FK_Act_Lead FOREIGN KEY (LeadId) REFERENCES dbo.Leads(Id) ON DELETE CASCADE,
        CONSTRAINT FK_Act_User FOREIGN KEY (UserId) REFERENCES dbo.Users(Id),
        CONSTRAINT CK_Act_Type CHECK (Type IN
            ('NOTE','CALL','WHATSAPP','EMAIL','MEETING','SITE_VISIT','DOCUMENT',
             'BOOKING','PAYMENT','ASSIGNMENT','STAGE_CHANGE','CREATED','MERGE'))
    );
    CREATE INDEX IX_Act_Lead_Occurred ON dbo.LeadActivities (LeadId, OccurredAt DESC)
        INCLUDE (Type, Body, UserId);
END
GO

/* The timeline is immutable. These triggers are the enforcement — application
   code cannot be trusted to remain the only writer forever. */
IF OBJECT_ID('dbo.TR_LeadActivities_NoChange', 'TR') IS NOT NULL
    DROP TRIGGER dbo.TR_LeadActivities_NoChange;
GO
CREATE TRIGGER dbo.TR_LeadActivities_NoChange ON dbo.LeadActivities
INSTEAD OF UPDATE, DELETE AS
BEGIN
    RAISERROR ('LeadActivities is append-only; rows cannot be modified or deleted.', 16, 1);
    ROLLBACK TRANSACTION;
END
GO

/* ───────────────────────────────────────────────────────── AuditLog ───── */
IF OBJECT_ID('dbo.AuditLog', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditLog (
        Id         BIGINT IDENTITY(1,1) NOT NULL,
        UserId     UNIQUEIDENTIFIER NULL,
        Action     VARCHAR(64)      NOT NULL,
        Entity     VARCHAR(48)      NOT NULL,
        EntityId   NVARCHAR(64)     NOT NULL,
        BeforeJson NVARCHAR(MAX)    NULL,
        AfterJson  NVARCHAR(MAX)    NULL,
        Ip         VARCHAR(64)      NULL,
        UserAgent  NVARCHAR(400)    NULL,
        CreatedAt  DATETIME2(3)     NOT NULL CONSTRAINT DF_Audit_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_AuditLog PRIMARY KEY CLUSTERED (Id)
    );
    CREATE INDEX IX_Audit_Entity ON dbo.AuditLog (Entity, EntityId, CreatedAt DESC);
END
GO
IF OBJECT_ID('dbo.TR_AuditLog_NoChange', 'TR') IS NOT NULL
    DROP TRIGGER dbo.TR_AuditLog_NoChange;
GO
CREATE TRIGGER dbo.TR_AuditLog_NoChange ON dbo.AuditLog
INSTEAD OF UPDATE, DELETE AS
BEGIN
    RAISERROR ('AuditLog is append-only.', 16, 1);
    ROLLBACK TRANSACTION;
END
GO

/* ───────────────────────────────────── Idempotency for inbound webhooks ─ */
/* Ad platforms retry aggressively. A delivery key seen twice must not create
   two leads, and that check belongs in the database, not in process memory. */
IF OBJECT_ID('dbo.WebhookDeliveries', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.WebhookDeliveries (
        DeliveryKey VARCHAR(128)     NOT NULL,
        Source      VARCHAR(20)      NOT NULL,
        LeadId      UNIQUEIDENTIFIER NULL,
        ReceivedAt  DATETIME2(3)     NOT NULL CONSTRAINT DF_Hook_ReceivedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_WebhookDeliveries PRIMARY KEY CLUSTERED (DeliveryKey)
    );
END
GO
