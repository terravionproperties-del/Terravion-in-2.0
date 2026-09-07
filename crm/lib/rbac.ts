import type { Role } from "./auth";

/**
 * Permissions.
 *
 * Stated as `resource:action` rather than as screens, because screens change
 * and authority does not. A telecaller may create and update a lead but never
 * see a payment; finance may record a payment but never reassign a lead.
 *
 * Two rules the matrix encodes that are easy to get wrong:
 *   · Nobody, including ADMIN, may delete an audit entry. It is append-only,
 *     so no `audit:delete` permission exists to grant.
 *   · Scope is separate from permission. `lead:read` says a user may read
 *     leads; `scopeFor()` says which ones. A sales executive holding
 *     `lead:read` still only sees their own — enforced in the query, not the UI.
 */
export const PERMISSIONS = [
  "dashboard:read",
  "dashboard:read_financial",

  "lead:create",
  "lead:read",
  "lead:update",
  "lead:delete",
  "lead:assign",
  "lead:merge",
  "lead:export",

  "activity:create",
  "activity:read",

  "task:create",
  "task:read",
  "task:update",

  "visit:create",
  "visit:read",
  "visit:update",

  "inventory:read",
  "inventory:update",
  "inventory:hold",
  "inventory:price",

  "booking:create",
  "booking:read",
  "booking:update",
  "booking:cancel",

  "payment:create",
  "payment:read",
  "payment:update",
  "payment:refund",

  "document:create",
  "document:read",
  "document:delete",

  "broker:read",
  "broker:manage",
  "commission:read",
  "commission:approve",

  "campaign:read",
  "campaign:manage",

  "report:read",
  "report:financial",

  "user:read",
  "user:manage",
  "audit:read",

  // Own login history and devices. Held by every staff role, because a person
  // seeing where their own account has been signed in is a safety feature, not
  // a privilege. Administering *other* people's sessions needs `user:manage`.
  "security:read",
  "system:read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ALL = [...PERMISSIONS];

/** Everything a role may do. Absent means denied — there is no implicit grant. */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  ADMIN: ALL,

  SALES_MANAGER: [
    "dashboard:read",
    "dashboard:read_financial",
    "lead:create", "lead:read", "lead:update", "lead:assign", "lead:merge", "lead:export",
    "activity:create", "activity:read",
    "task:create", "task:read", "task:update",
    "visit:create", "visit:read", "visit:update",
    "inventory:read", "inventory:hold",
    "booking:create", "booking:read", "booking:update",
    "payment:read",
    "document:create", "document:read",
    "broker:read", "commission:read",
    "campaign:read",
    "report:read", "report:financial",
    "user:read",
    "security:read",
  ],

  SALES_EXECUTIVE: [
    "dashboard:read",
    "lead:create", "lead:read", "lead:update",
    "activity:create", "activity:read",
    "task:create", "task:read", "task:update",
    "visit:create", "visit:read", "visit:update",
    "inventory:read", "inventory:hold",
    "booking:create", "booking:read",
    "document:create", "document:read",
    "report:read",
    "security:read",
  ],

  // Works the phones. Can qualify and schedule, cannot touch inventory or money.
  TELECALLER: [
    "dashboard:read",
    "lead:create", "lead:read", "lead:update",
    "activity:create", "activity:read",
    "task:create", "task:read", "task:update",
    "visit:create", "visit:read",
    "inventory:read",
    "security:read",
  ],

  MARKETING: [
    "dashboard:read",
    "lead:read", "lead:export",
    "activity:read",
    "campaign:read", "campaign:manage",
    "report:read",
    "inventory:read",
    "security:read",
  ],

  FINANCE: [
    "dashboard:read", "dashboard:read_financial",
    "lead:read",
    "booking:read", "booking:update",
    "payment:create", "payment:read", "payment:update", "payment:refund",
    "document:create", "document:read",
    "commission:read", "commission:approve",
    "inventory:read", "inventory:price",
    "report:read", "report:financial",
    "security:read",
  ],

  // Channel partner. Sees only their own registered leads and public inventory.
  BROKER: [
    "dashboard:read",
    "lead:create", "lead:read",
    "activity:read",
    "visit:read",
    "inventory:read",
    "commission:read",
    "document:read",
    "security:read",
  ],

  SUPPORT: [
    "dashboard:read",
    "lead:read",
    "activity:create", "activity:read",
    "task:create", "task:read", "task:update",
    "booking:read",
    "document:read",
    "security:read",
  ],

  // Portal login. Sees their own bookings only; never the CRM.
  CUSTOMER: ["booking:read", "payment:read", "document:read"],
};

export function can(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function canAny(role: Role | undefined, permissions: Permission[]): boolean {
  return permissions.some((p) => can(role, p));
}

/**
 * Row-level scope.
 *
 * `all`   — every record
 * `own`   — only records the user owns
 * `none`  — no access
 *
 * Returned separately from `can()` so a query can apply it as a where-clause.
 * Filtering in the component instead of the query is how records leak.
 */
export type Scope = "all" | "own" | "none";

export function scopeFor(role: Role | undefined, resource: "lead" | "booking"): Scope {
  if (!role) return "none";
  switch (role) {
    case "ADMIN":
    case "SALES_MANAGER":
    case "FINANCE":
      return "all";
    case "MARKETING":
    case "SUPPORT":
      return resource === "lead" ? "all" : "none";
    case "SALES_EXECUTIVE":
    case "TELECALLER":
    case "BROKER":
      return "own";
    case "CUSTOMER":
      return resource === "booking" ? "own" : "none";
    default:
      return "none";
  }
}

/**
 * Navigation is derived from permissions, never hand-maintained per role.
 *
 * `built` is the honest half of this list. The modules below Leads are planned
 * and their permissions already exist, but their routes do not — and a nav item
 * that leads to a 404 is worse than an absent one, because it reads as a broken
 * product rather than an unfinished one. Each entry flips to `built: true` in
 * the same commit that ships its route.
 */
export const NAV: {
  href: string;
  label: string;
  icon?: string;
  permission: Permission;
  built: boolean;
}[] = [
  { href: "/",                label: "Dashboard",       icon: "dashboard",  permission: "dashboard:read",  built: true },
  { href: "/projects",        label: "Projects",        icon: "projects",   permission: "dashboard:read",  built: true },
  { href: "/leads",           label: "Leads",           icon: "leads",      permission: "lead:read",       built: true },
  { href: "/inventory",       label: "GIS Master Plan", icon: "gis",        permission: "inventory:read", built: true },
  { href: "/media",           label: "Media Library",   icon: "media",      permission: "dashboard:read",  built: true },
  { href: "/whatsapp",        label: "WhatsApp Hub",    icon: "whatsapp",   permission: "lead:read",       built: true },
  { href: "/calendar",        label: "Calendar & Visits",icon: "calendar",  permission: "activity:read",   built: true },
  { href: "/duplicates",      label: "Duplicates",      icon: "duplicates", permission: "lead:merge",      built: true },
  { href: "/reports",         label: "Reports",         icon: "reports",    permission: "report:read",     built: true },
  { href: "/security",        label: "Security",        icon: "security",   permission: "security:read",   built: true },
  { href: "/system",          label: "System",          icon: "system",     permission: "system:read",     built: true },
];

export function navFor(role: Role | undefined) {
  return NAV.filter((item) => item.built && can(role, item.permission));
}
