# Journey YouTube livestream scheduler

This Google Apps Script keeps one next Journey service advertised on YouTube.

- Sunday Worship: Sundays at 10:00 AM America/Detroit
- Wisdom Wednesdays: Wednesdays at 7:00 PM America/Detroit
- Fourth Wednesdays are skipped.
- A missed event remains available for 150 minutes, then advances to the next valid service.
- Completed broadcasts remain in YouTube's archive.
- Scheduled broadcasts are public, embeddable, recorded from the start, and use auto-start/auto-stop.

## One-time activation

1. Create a standalone Apps Script project while signed in to the Google account that owns Journey's YouTube channel.
2. Replace `Code.gs` with the repository's `Code.gs`.
3. Enable the **YouTube Data API v3** advanced service.
4. Set the project time zone to **America/Detroit**.
5. Run `previewJourneyLivestreamSchedule` and confirm the next six dates.
6. Run `setupJourneyLivestreamScheduler`, review Google's permissions, and approve access.
7. Confirm the execution result is `created`, `updated`, or `already-current` and verify the correct upcoming event on Journey's YouTube channel.

The setup function installs a single hourly trigger. Rerunning setup replaces that trigger instead of creating duplicates.
