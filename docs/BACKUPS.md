# Database Backups

Opervia stores all customer data in PostgreSQL (typically Neon on Vercel).

## Neon (recommended)

If using Neon:

1. Enable **Point-in-Time Recovery (PITR)** on your production branch
2. Note your recovery window (e.g. 7 days on paid plans)
3. Document who can initiate restores and the approval process

## Manual exports

For ad-hoc backups:

```bash
pg_dump "$DATABASE_URL" --format=custom --file=opervia-backup-$(date +%F).dump
```

Store dumps encrypted (e.g. password manager vault, S3 with SSE).

## Restore test (quarterly)

1. Restore a backup to a **non-production** branch or local database
2. Run `npx prisma migrate deploy`
3. Verify login and sample org data load correctly

## Application-level export

Workspace owners can export JSON from **Settings → Workspace data & deletion**. Enterprise plans also have CSV bulk export.

## Incident response

If data loss is suspected:

1. Stop writes (enable maintenance mode via super admin)
2. Contact Neon support or restore from PITR
3. Notify affected customers per GDPR breach assessment if personal data was lost
