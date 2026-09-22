# Journey YouTube livestream scheduler

This Google Apps Script keeps one next Journey service advertised on YouTube and provides authenticated YouTube data to the Journey website without exposing an API key.

- Sunday Worship: Sundays at 10:00 AM America/Detroit
- A missed event remains available for 150 minutes, then advances to the next valid service.
- Completed broadcasts remain in YouTube's archive.
- Scheduled broadcasts are public, recorded from the start, and use auto-start/auto-stop.

## One-time activation

1. Create a standalone Apps Script project while signed in to the Google account that owns Journey's YouTube channel.
2. Replace `Code.gs` with the repository's `Code.gs`.
3. Enable the **YouTube Data API v3** advanced service.
4. Set the project time zone to **America/Detroit**.
5. Run `previewJourneyLivestreamSchedule` and confirm the next six dates.
6. Run `setupJourneyLivestreamScheduler`, review Google's permissions, and approve access.
7. Confirm the execution result is `created`, `updated`, or `already-current` and verify the correct upcoming event on Journey's YouTube channel.
8. Deploy the script as a **Web app**, set **Execute as** to **Me**, and set access to **Anyone**.

The setup function installs a single hourly trigger. Rerunning setup replaces that trigger instead of creating duplicates.

## Website endpoints

- The base web-app URL returns the current live broadcast and the next advertised Sunday event.
- Add `?view=archive` to return every public upload and completed livestream, newest first. Scheduled events, currently-live broadcasts, private videos, and the known broken video are excluded.

The archive endpoint uses the script owner's existing Google authorization. The website does not need a `YOUTUBE_API_KEY`. The website should fetch the archive server-side and cache it; the Apps Script response itself is intentionally uncached so a website cache invalidation can retrieve a newly completed broadcast immediately.
