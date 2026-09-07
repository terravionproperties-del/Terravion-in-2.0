/* ═══════════════════════════════════════════════════════════════════════
   Terravion OS — Module 3, requirement 12: security
       node scripts/apply-sql.mjs db/004_security.sql
   Idempotent. One column and one index. Everything else this feature
   needs — dbo.LoginHistory and the Users policy columns — already exists
   in db/002_module3.sql and is used as it stands.
   ═══════════════════════════════════════════════════════════════════════ */

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/* ── Device on a login ───────────────────────────────────────────────
   LoginHistory records the user-agent string but not the device it
   describes. Parsing it on every read is the same work repeated forever,
   and the device-history screen groups by it. Stored at write time, in
   the same VARCHAR(16) domain as dbo.LeadActivities.DeviceType:
   desktop | mobile | tablet, or NULL when there was no user-agent. */
IF COL_LENGTH('dbo.LoginHistory', 'DeviceType') IS NULL
    ALTER TABLE dbo.LoginHistory ADD DeviceType VARCHAR(16) NULL;
GO

/* Supports the admin view: recent failures across every account.
   Filtered, because successful logins are the bulk of the table and are
   never what this index is asked for. */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Login_Failures')
    CREATE INDEX IX_Login_Failures ON dbo.LoginHistory (OccurredAt DESC)
        INCLUDE (Email, UserId, Reason, Ip, Browser, Os, DeviceType, City)
        WHERE Success = 0;
GO
