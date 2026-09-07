/* ═══════════════════════════════════════════════════════════════════════
   Terravion OS — backup and retention
       node scripts/apply-sql.mjs db/003_backup.sql
   Idempotent: every object is CREATE OR ALTER.

   This file creates procedures. It takes no backup by itself and schedules
   nothing. A DBA runs it once, then builds the Agent jobs below.

   ── What the procedures assume ──────────────────────────────────────
     · The database is in FULL recovery. usp_BackupLog refuses to run
       otherwise rather than failing hourly with error 4208 until someone
       stops reading the alerts.
     · The SQL Server *service* account can write to the backup directory.
       Not the DBA's account — the service account. A UNC path needs the
       service running as a domain account with rights on that share.
     · Backups go to a different physical device from the data files. A
       backup on the disk that failed is not a backup.
     · usp_BackupRetention needs sysadmin, because xp_delete_file does.

   ── The Agent jobs to create ────────────────────────────────────────
   Three jobs. Owner sa, "notify operator on failure" set on every one, and
   the same @Directory in all three or retention will not find the files.

     1. "Terravion — Full backup"
        Schedule : daily, 01:15
        Step     : EXEC dbo.usp_BackupFull @Directory = N'E:\SQLBackups\';

     2. "Terravion — Log backup"
        Schedule : daily, every 1 hour between 00:00 and 23:59
        Step     : EXEC dbo.usp_BackupLog @Directory = N'E:\SQLBackups\';
        The gap between log backups is the data lost in a restore. Hourly
        means an hour lost, worst case. Fifteen minutes costs almost
        nothing extra if the business will not accept an hour.

     3. "Terravion — Backup retention"
        Schedule : daily, 03:00 — after the full has finished, never before
        Step     : EXEC dbo.usp_BackupRetention
                       @Directory = N'E:\SQLBackups\',
                       @FullDays  = 14,
                       @LogDays   = 3;

   A differential job is deliberately not proposed. Daily full plus hourly
   log restores in two steps; adding differentials lengthens the chain and
   makes the restore harder to reason about under pressure. usp_BackupDiff
   exists for the case where the full outgrows its window.

   ── Restoring ───────────────────────────────────────────────────────
   Read this before you need it, not during.

   Step 0. Back up the tail of the log first, if the server is reachable.
           Skipping this discards every transaction since the last log
           backup — the ones you most want back.

       BACKUP LOG [TerravionCRM]
         TO DISK = N'E:\SQLBackups\TerravionCRM_TAIL.trn'
         WITH NORECOVERY, CHECKSUM, COMPRESSION;

   Step 1. Restore the most recent full, leaving the database recovering.

       RESTORE DATABASE [TerravionCRM]
         FROM DISK = N'E:\SQLBackups\TerravionCRM_FULL_20260806_011500.bak'
         WITH NORECOVERY, REPLACE, CHECKSUM, STATS = 5;

   Step 2. The most recent differential, if any are being taken. Skip when
           only fulls and logs exist.

       RESTORE DATABASE [TerravionCRM]
         FROM DISK = N'E:\SQLBackups\TerravionCRM_DIFF_20260806_131500.bak'
         WITH NORECOVERY, CHECKSUM;

   Step 3. Every log taken after that backup, in order, oldest first, then
           the tail. One missing file breaks the chain.

       RESTORE LOG [TerravionCRM]
         FROM DISK = N'E:\SQLBackups\TerravionCRM_LOG_20260806_140000.trn'
         WITH NORECOVERY, CHECKSUM;
       RESTORE LOG [TerravionCRM]
         FROM DISK = N'E:\SQLBackups\TerravionCRM_TAIL.trn'
         WITH NORECOVERY, CHECKSUM;

   Step 4. Open it.

       RESTORE DATABASE [TerravionCRM] WITH RECOVERY;

   To stop just before a mistake — a bad UPDATE at 14:32 — recover the
   final log to a point in time instead of step 4:

       RESTORE LOG [TerravionCRM]
         FROM DISK = N'E:\SQLBackups\TerravionCRM_LOG_20260806_150000.trn'
         WITH RECOVERY, STOPAT = N'2026-08-06T14:31:00';

   Useful before any of it:
       RESTORE HEADERONLY   FROM DISK = N'...\TerravionCRM_FULL_....bak';
       RESTORE FILELISTONLY FROM DISK = N'...\TerravionCRM_FULL_....bak';
       RESTORE VERIFYONLY   FROM DISK = N'...\TerravionCRM_FULL_....bak';

   A restore that has never been rehearsed is a hypothesis. Restore to a
   spare instance under a different name once a quarter and time it. The
   number needed during an outage is how long this takes, and the only way
   to know it is to have done it.
   ═══════════════════════════════════════════════════════════════════════ */

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/* ── Shared guard ────────────────────────────────────────────────────
   Every procedure here builds its BACKUP statement as text, because
   BACKUP will not accept a variable for its device. That makes @Directory
   an injection surface reachable by whoever can execute the procedure, so
   it is validated before it is ever concatenated: no quote, no semicolon,
   no comment marker, no newline, and it must look like a path. The
   database name goes through QUOTENAME.

   Defence in depth rather than paranoia — these run under an Agent
   account with far more authority than the application ever has. */
CREATE OR ALTER PROCEDURE dbo.usp_BackupValidateDirectory
    @Directory NVARCHAR(400) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF @Directory IS NULL OR LEN(LTRIM(RTRIM(@Directory))) = 0
        THROW 51000, 'A backup directory is required. There is no default, on purpose.', 1;

    SET @Directory = LTRIM(RTRIM(@Directory));

    IF @Directory LIKE '%[;'']%'
       OR @Directory LIKE '%--%'
       OR CHARINDEX('/*', @Directory) > 0
       OR CHARINDEX(CHAR(10), @Directory) > 0
       OR CHARINDEX(CHAR(13), @Directory) > 0
        THROW 51001, 'The backup directory contains characters not permitted in a path.', 1;

    IF NOT (@Directory LIKE '[A-Z]:\%' OR @Directory LIKE '\\%')
        THROW 51002, 'The backup directory must be a drive path (E:\...) or a UNC path (\\host\share\...).', 1;

    -- a missing trailing separator silently writes the file one level up
    IF RIGHT(@Directory, 1) <> '\'
        SET @Directory = @Directory + '\';
END
GO

/* ── Full backup ─────────────────────────────────────────────────────
   COMPRESSION because a compressed backup is smaller and, counter-
   intuitively, usually faster — less to write is worth the CPU. Express
   and Web editions do not support it, so the clause is dropped there
   rather than failing the job every night.

   CHECKSUM verifies every page on the way out and stores a checksum for
   the backup itself. It is the difference between finding corruption
   tonight and finding it during a restore.

   INIT overwrites the media set in the target file. With a timestamped
   filename that means a re-run inside the same second replaces its own
   output instead of appending to it. */
CREATE OR ALTER PROCEDURE dbo.usp_BackupFull
    @Directory NVARCHAR(400),
    @Database  SYSNAME = NULL,
    @Verify    BIT     = 1
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    EXEC dbo.usp_BackupValidateDirectory @Directory = @Directory OUTPUT;

    SET @Database = COALESCE(@Database, DB_NAME());
    IF DB_ID(@Database) IS NULL
        THROW 51010, 'That database does not exist on this instance.', 1;

    DECLARE @stamp CHAR(15) =
            CONVERT(CHAR(8), SYSDATETIME(), 112) + '_' +
            REPLACE(CONVERT(CHAR(8), SYSDATETIME(), 108), ':', '');
    DECLARE @file NVARCHAR(800) =
            @Directory + @Database + N'_FULL_' + @stamp + N'.bak';
    DECLARE @compress NVARCHAR(20) =
            CASE WHEN CAST(SERVERPROPERTY('Edition') AS NVARCHAR(200)) LIKE 'Express%'
                   OR CAST(SERVERPROPERTY('Edition') AS NVARCHAR(200)) LIKE 'Web%'
                 THEN N'' ELSE N'COMPRESSION, ' END;

    DECLARE @sql NVARCHAR(MAX) =
        N'BACKUP DATABASE ' + QUOTENAME(@Database) +
        N' TO DISK = N''' + REPLACE(@file, '''', '''''') + N'''' +
        N' WITH ' + @compress + N'CHECKSUM, INIT, STATS = 10,' +
        N' NAME = N''' + REPLACE(@Database, '''', '''''') + N' full'',' +
        N' DESCRIPTION = N''Terravion OS scheduled full backup'';';

    PRINT @sql;
    EXEC sys.sp_executesql @sql;

    -- Reads the whole file back. It costs what it costs; a backup nobody
    -- verified is a file, not a backup.
    IF @Verify = 1
    BEGIN
        DECLARE @check NVARCHAR(MAX) =
            N'RESTORE VERIFYONLY FROM DISK = N''' +
            REPLACE(@file, '''', '''''') + N''' WITH CHECKSUM;';
        EXEC sys.sp_executesql @check;
    END
END
GO

/* ── Differential ────────────────────────────────────────────────────
   A differential is meaningless without the full it is measured against,
   and SQL Server's own error for that (3035) does not say so plainly. The
   chain is checked first and the message names the fix. */
CREATE OR ALTER PROCEDURE dbo.usp_BackupDiff
    @Directory NVARCHAR(400),
    @Database  SYSNAME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    EXEC dbo.usp_BackupValidateDirectory @Directory = @Directory OUTPUT;

    SET @Database = COALESCE(@Database, DB_NAME());
    IF DB_ID(@Database) IS NULL
        THROW 51010, 'That database does not exist on this instance.', 1;

    IF NOT EXISTS (
        SELECT 1 FROM msdb.dbo.backupset
        WHERE database_name = @Database AND type = 'D'
    )
        THROW 51020, 'No full backup exists for this database. Run dbo.usp_BackupFull first — a differential has nothing to differ from.', 1;

    DECLARE @stamp CHAR(15) =
            CONVERT(CHAR(8), SYSDATETIME(), 112) + '_' +
            REPLACE(CONVERT(CHAR(8), SYSDATETIME(), 108), ':', '');
    DECLARE @file NVARCHAR(800) =
            @Directory + @Database + N'_DIFF_' + @stamp + N'.bak';
    DECLARE @compress NVARCHAR(20) =
            CASE WHEN CAST(SERVERPROPERTY('Edition') AS NVARCHAR(200)) LIKE 'Express%'
                   OR CAST(SERVERPROPERTY('Edition') AS NVARCHAR(200)) LIKE 'Web%'
                 THEN N'' ELSE N'COMPRESSION, ' END;

    DECLARE @sql NVARCHAR(MAX) =
        N'BACKUP DATABASE ' + QUOTENAME(@Database) +
        N' TO DISK = N''' + REPLACE(@file, '''', '''''') + N'''' +
        N' WITH DIFFERENTIAL, ' + @compress + N'CHECKSUM, INIT, STATS = 10,' +
        N' NAME = N''' + REPLACE(@Database, '''', '''''') + N' differential'';';

    PRINT @sql;
    EXEC sys.sp_executesql @sql;
END
GO

/* ── Log backup ──────────────────────────────────────────────────────
   Only meaningful in FULL or BULK_LOGGED recovery. In SIMPLE the engine
   truncates the log at every checkpoint and there is nothing to back up,
   so the job would fail every hour — and an hourly failure becomes an
   ignored failure inside a week. It refuses with a sentence instead. */
CREATE OR ALTER PROCEDURE dbo.usp_BackupLog
    @Directory NVARCHAR(400),
    @Database  SYSNAME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    EXEC dbo.usp_BackupValidateDirectory @Directory = @Directory OUTPUT;

    SET @Database = COALESCE(@Database, DB_NAME());
    IF DB_ID(@Database) IS NULL
        THROW 51010, 'That database does not exist on this instance.', 1;

    IF EXISTS (
        SELECT 1 FROM sys.databases
        WHERE name = @Database AND recovery_model_desc = 'SIMPLE'
    )
        THROW 51030, 'This database is in SIMPLE recovery, so log backups are impossible and point-in-time restore is not available. Switch it to FULL and take a full backup, or delete this job.', 1;

    IF NOT EXISTS (
        SELECT 1 FROM msdb.dbo.backupset
        WHERE database_name = @Database AND type = 'D'
    )
        THROW 51031, 'No full backup exists yet, so the log chain has not started. Run dbo.usp_BackupFull first.', 1;

    DECLARE @stamp CHAR(15) =
            CONVERT(CHAR(8), SYSDATETIME(), 112) + '_' +
            REPLACE(CONVERT(CHAR(8), SYSDATETIME(), 108), ':', '');
    DECLARE @file NVARCHAR(800) =
            @Directory + @Database + N'_LOG_' + @stamp + N'.trn';
    DECLARE @compress NVARCHAR(20) =
            CASE WHEN CAST(SERVERPROPERTY('Edition') AS NVARCHAR(200)) LIKE 'Express%'
                   OR CAST(SERVERPROPERTY('Edition') AS NVARCHAR(200)) LIKE 'Web%'
                 THEN N'' ELSE N'COMPRESSION, ' END;

    DECLARE @sql NVARCHAR(MAX) =
        N'BACKUP LOG ' + QUOTENAME(@Database) +
        N' TO DISK = N''' + REPLACE(@file, '''', '''''') + N'''' +
        N' WITH ' + @compress + N'CHECKSUM, INIT, STATS = 25,' +
        N' NAME = N''' + REPLACE(@Database, '''', '''''') + N' log'';';

    PRINT @sql;
    EXEC sys.sp_executesql @sql;
END
GO

/* ── Retention ───────────────────────────────────────────────────────
   Two separate pieces of work, both needed:

     · msdb.dbo.sp_delete_backuphistory trims the history tables. Left
       alone for years they reach millions of rows and make msdb itself
       slow to back up and restore. Deleting history does NOT delete files.
     · xp_delete_file deletes the files. It refuses anything that does not
       carry a SQL Server backup header, so it cannot be aimed at a folder
       of documents and told to clear it — but it is still an extended
       procedure that deletes things and needs sysadmin, so keep its
       parameters under review.

   Fulls and logs age separately. Fourteen days of fulls with three days of
   logs is the usual shape: the logs between two expired fulls restore
   nothing once the fulls either side are gone.

   The floor of two days is here because a retention job that accepts 0 is
   one typo away from deleting tonight's backup. */
CREATE OR ALTER PROCEDURE dbo.usp_BackupRetention
    @Directory NVARCHAR(400),
    @FullDays  INT = 14,
    @LogDays   INT = 3
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    EXEC dbo.usp_BackupValidateDirectory @Directory = @Directory OUTPUT;

    IF @FullDays < 2 OR @LogDays < 2
        THROW 51040, 'Retention below two days is refused. Raise the value, or delete files by hand and mean it.', 1;

    DECLARE @fullCutoff DATETIME = DATEADD(DAY, -@FullDays, GETDATE());
    DECLARE @logCutoff  DATETIME = DATEADD(DAY, -@LogDays,  GETDATE());

    -- Files first. If history were trimmed first and the file delete then
    -- failed, nothing would be left to say which files should have gone.
    EXEC master.sys.xp_delete_file 0, @Directory, N'bak', @fullCutoff, 1;
    EXEC master.sys.xp_delete_file 0, @Directory, N'trn', @logCutoff,  1;

    -- History is trimmed to the older cutoff, so the record of a full
    -- outlives the logs that depended on it.
    EXEC msdb.dbo.sp_delete_backuphistory @oldest_date = @fullCutoff;

    PRINT 'Retention complete. Removed .bak older than '
        + CONVERT(NVARCHAR(30), @fullCutoff, 120) + ' and .trn older than '
        + CONVERT(NVARCHAR(30), @logCutoff, 120) + '.';
END
GO

/* ── Permissions ─────────────────────────────────────────────────────
   The CRM application login holds none of this. It connects to run the
   product, and a compromised web process must not be able to write a
   backup file to a share of its choosing. Grant to the Agent account only:

       GRANT EXECUTE ON dbo.usp_BackupFull      TO [TERRAVION\sql_agent];
       GRANT EXECUTE ON dbo.usp_BackupDiff      TO [TERRAVION\sql_agent];
       GRANT EXECUTE ON dbo.usp_BackupLog       TO [TERRAVION\sql_agent];
       GRANT EXECUTE ON dbo.usp_BackupRetention TO [TERRAVION\sql_agent];

   For the /system page to show backup history, a separate and much
   smaller grant is needed — read-only, on msdb:

       USE msdb;
       CREATE USER [terravion_app] FOR LOGIN [terravion_app];
       GRANT SELECT ON dbo.backupset TO [terravion_app];

   Without it the page reports that it cannot read the history, which is
   the correct thing for it to say. */
