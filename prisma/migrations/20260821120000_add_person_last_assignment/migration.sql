-- AlterTable
ALTER TABLE "Person" ADD COLUMN "lastAssignmentDate" TIMESTAMP(3);

-- Backfill: data da designação mais recente (semanas já iniciadas ou passadas)
UPDATE "Person" AS p
SET "lastAssignmentDate" = sub."maxWeek"
FROM (
    SELECT sa."personId", MAX(sm."weekStart") AS "maxWeek"
    FROM "ScheduledAssignment" sa
    JOIN "ScheduledMeeting" sm ON sm."id" = sa."scheduledMeetingId"
    WHERE sm."weekStart" <= CURRENT_DATE
    GROUP BY sa."personId"
) AS sub
WHERE p."id" = sub."personId";
