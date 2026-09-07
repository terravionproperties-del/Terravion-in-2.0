/* ═══════════════════════════════════════════════════════════════════════
   Terravion OS — Module 3 completion
       node scripts/apply-sql.mjs db/002_module3.sql
   Idempotent. Adds forensics to the timeline, duplicate/merge history,
   notification outbox, login and device history, and saved searches.
   ═══════════════════════════════════════════════════════════════════════ */

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/* ── Timeline forensics ──────────────────────────────────────────────
   Who, from where, on what, and what changed. Added as columns rather
   than buried in MetaJson so they can be indexed and reported on. */
IF COL_LENGTH('dbo.LeadActivities', 'Ip') IS NULL
    ALTER TABLE dbo.LeadActivities ADD
        Ip          VARCHAR(64)   NULL,
        UserAgent   NVARCHAR(400) NULL,
        Browser     NVARCHAR(80)  NULL,
        Os          NVARCHAR(80)  NULL,
        DeviceType  VARCHAR(16)   NULL,
        City        NVARCHAR(120) NULL,
        Country     VARCHAR(4)    NULL,
        Channel     VARCHAR(20)   NULL,   -- CRM | WEBSITE | WHATSAPP | API
        BeforeJson  NVARCHAR(MAX) NULL,
        AfterJson   NVARCHAR(MAX) NULL;
GO

/* ── Merge history ───────────────────────────────────────────────────
   A merge is destructive to the losing record's identity, so the exact
   decision is preserved: what matched, who approved it, what was kept. */
IF OBJECT_ID('dbo.LeadMerges', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.LeadMerges (
        Id           UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Merge_Id DEFAULT NEWSEQUENTIALID(),
        SurvivorId   UNIQUEIDENTIFIER NOT NULL,
        MergedId     UNIQUEIDENTIFIER NOT NULL,
        MatchedOn    VARCHAR(40)      NOT NULL,   -- PHONE | EMAIL | WHATSAPP | NAME | MANUAL
        Confidence   TINYINT          NOT NULL CONSTRAINT DF_Merge_Conf DEFAULT 100,
        SnapshotJson NVARCHAR(MAX)    NULL,       -- the merged record as it was
        MergedById   UNIQUEIDENTIFIER NULL,
        MergedAt     DATETIME2(3)     NOT NULL CONSTRAINT DF_Merge_At DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_LeadMerges PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT FK_Merge_Survivor FOREIGN KEY (SurvivorId) REFERENCES dbo.Leads(Id),
        CONSTRAINT FK_Merge_Merged   FOREIGN KEY (MergedId)   REFERENCES dbo.Leads(Id),
        CONSTRAINT FK_Merge_User     FOREIGN KEY (MergedById) REFERENCES dbo.Users(Id)
    );
    CREATE INDEX IX_Merge_Survivor ON dbo.LeadMerges (SurvivorId, MergedAt DESC);
END
GO

/* ── Notification outbox ─────────────────────────────────────────────
   Messages are written here inside the same transaction as the change
   that caused them, then delivered by a worker. Calling a provider API
   mid-transaction means a rollback still sends the message. */
IF OBJECT_ID('dbo.Notifications', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Notifications (
        Id           UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Notif_Id DEFAULT NEWSEQUENTIALID(),
        Channel      VARCHAR(12)      NOT NULL,   -- WHATSAPP | EMAIL | SMS
        Kind         VARCHAR(32)      NOT NULL,   -- FOLLOW_UP | SITE_VISIT | PAYMENT | TASK | BOOKING
        Recipient    NVARCHAR(256)    NOT NULL,   -- E.164 or email
        Subject      NVARCHAR(300)    NULL,
        Body         NVARCHAR(MAX)    NOT NULL,
        TemplateName NVARCHAR(120)    NULL,       -- WhatsApp requires an approved template
        TemplateArgs NVARCHAR(MAX)    NULL,
        LeadId       UNIQUEIDENTIFIER NULL,
        Status       VARCHAR(12)      NOT NULL CONSTRAINT DF_Notif_Status DEFAULT 'PENDING',
        Attempts     TINYINT          NOT NULL CONSTRAINT DF_Notif_Attempts DEFAULT 0,
        LastError    NVARCHAR(600)    NULL,
        ProviderId   NVARCHAR(200)    NULL,
        ScheduledFor DATETIME2(3)     NOT NULL CONSTRAINT DF_Notif_Sched DEFAULT SYSUTCDATETIME(),
        SentAt       DATETIME2(3)     NULL,
        CreatedAt    DATETIME2(3)     NOT NULL CONSTRAINT DF_Notif_Created DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_Notifications PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT FK_Notif_Lead FOREIGN KEY (LeadId) REFERENCES dbo.Leads(Id) ON DELETE CASCADE,
        CONSTRAINT CK_Notif_Channel CHECK (Channel IN ('WHATSAPP','EMAIL','SMS')),
        CONSTRAINT CK_Notif_Status CHECK (Status IN ('PENDING','SENDING','SENT','FAILED','CANCELLED'))
    );
    -- the worker's claim query: due, not yet sent, oldest first
    CREATE INDEX IX_Notif_Due ON dbo.Notifications (Status, ScheduledFor)
        INCLUDE (Channel, Recipient, Attempts);
END
GO

/* ── Login history ───────────────────────────────────────────────────
   Every attempt, successful or not. Failures are the interesting rows:
   they are what reveals a password-spray before it succeeds. */
IF OBJECT_ID('dbo.LoginHistory', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.LoginHistory (
        Id         BIGINT IDENTITY(1,1) NOT NULL,
        UserId     UNIQUEIDENTIFIER NULL,      -- NULL when the email is unknown
        Email      NVARCHAR(256)    NOT NULL,
        Success    BIT              NOT NULL,
        Reason     VARCHAR(40)      NULL,      -- BAD_PASSWORD | INACTIVE | UNKNOWN_USER | LOCKED
        Ip         VARCHAR(64)      NULL,
        UserAgent  NVARCHAR(400)    NULL,
        Browser    NVARCHAR(80)     NULL,
        Os         NVARCHAR(80)     NULL,
        City       NVARCHAR(120)    NULL,
        Country    VARCHAR(4)       NULL,
        OccurredAt DATETIME2(3)     NOT NULL CONSTRAINT DF_Login_At DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_LoginHistory PRIMARY KEY CLUSTERED (Id)
    );
    CREATE INDEX IX_Login_User ON dbo.LoginHistory (UserId, OccurredAt DESC);
    -- supports the rate limiter: failures for this email/IP in the last N minutes
    CREATE INDEX IX_Login_Email_Time ON dbo.LoginHistory (Email, OccurredAt DESC) INCLUDE (Success);
    CREATE INDEX IX_Login_Ip_Time ON dbo.LoginHistory (Ip, OccurredAt DESC) INCLUDE (Success);
END
GO

/* ── Security policy on the user ─────────────────────────────────── */
IF COL_LENGTH('dbo.Users', 'PasswordChangedAt') IS NULL
    ALTER TABLE dbo.Users ADD
        PasswordChangedAt  DATETIME2(3) NULL,
        MustChangePassword BIT NOT NULL CONSTRAINT DF_Users_MustChange DEFAULT 0,
        TwoFactorSecret    NVARCHAR(256) NULL,
        TwoFactorEnabled   BIT NOT NULL CONSTRAINT DF_Users_2FA DEFAULT 0,
        FailedAttempts     TINYINT NOT NULL CONSTRAINT DF_Users_Failed DEFAULT 0,
        LockedUntil        DATETIME2(3) NULL,
        AllowedIps         NVARCHAR(600) NULL;   -- comma-separated CIDRs; NULL = any
GO

/* ── Saved searches ────────────────────────────────────────────────── */
IF OBJECT_ID('dbo.SavedViews', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.SavedViews (
        Id          UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_View_Id DEFAULT NEWSEQUENTIALID(),
        UserId      UNIQUEIDENTIFIER NOT NULL,
        Name        NVARCHAR(120)    NOT NULL,
        Entity      VARCHAR(24)      NOT NULL,
        QueryString NVARCHAR(1000)   NOT NULL,
        CreatedAt   DATETIME2(3)     NOT NULL CONSTRAINT DF_View_At DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_SavedViews PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT FK_View_User FOREIGN KEY (UserId) REFERENCES dbo.Users(Id) ON DELETE CASCADE
    );
END
GO

/* Supporting indexes for duplicate matching. */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Leads_Email')
    CREATE INDEX IX_Leads_Email ON dbo.Leads (Email) WHERE Email IS NOT NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Leads_WhatsApp')
    CREATE INDEX IX_Leads_WhatsApp ON dbo.Leads (WhatsApp) WHERE WhatsApp IS NOT NULL;
GO

/* ── Duplicate candidates ────────────────────────────────────────────
   A view rather than a table: computed on read, so it can never go
   stale. Pairs are emitted once (a.Seq < b.Seq) rather than twice. */
IF OBJECT_ID('dbo.vLeadDuplicates', 'V') IS NOT NULL
    DROP VIEW dbo.vLeadDuplicates;
GO
CREATE VIEW dbo.vLeadDuplicates AS
SELECT
    a.Id AS LeftId, b.Id AS RightId,
    a.Reference AS LeftRef, b.Reference AS RightRef,
    a.Name AS LeftName, b.Name AS RightName,
    a.Phone AS LeftPhone, b.Phone AS RightPhone,
    a.CreatedAt AS LeftCreated, b.CreatedAt AS RightCreated,
    CASE
        WHEN a.Phone = b.Phone                                  THEN 'PHONE'
        WHEN a.WhatsApp IS NOT NULL AND a.WhatsApp = b.WhatsApp THEN 'WHATSAPP'
        WHEN a.Email IS NOT NULL AND a.Email = b.Email          THEN 'EMAIL'
        ELSE 'NAME'
    END AS MatchedOn,
    CASE
        WHEN a.Phone = b.Phone                                  THEN 100
        WHEN a.WhatsApp IS NOT NULL AND a.WhatsApp = b.WhatsApp THEN 95
        WHEN a.Email IS NOT NULL AND a.Email = b.Email          THEN 85
        ELSE 55
    END AS Confidence
FROM dbo.Leads AS a
JOIN dbo.Leads AS b
  ON a.Seq < b.Seq
 AND a.MergedIntoId IS NULL
 AND b.MergedIntoId IS NULL
 AND (
       a.Phone = b.Phone
    OR (a.WhatsApp IS NOT NULL AND a.WhatsApp = b.WhatsApp)
    OR (a.Email IS NOT NULL AND a.Email <> '' AND a.Email = b.Email)
    -- a name match alone is weak, so it only counts alongside a shared project
    OR (a.Name = b.Name AND a.ProjectId IS NOT NULL AND a.ProjectId = b.ProjectId)
 );
GO
