const JOURNEY_SCHEDULE = Object.freeze({
  timeZone: "America/Detroit",
  sundayTitle: "Sunday Worship",
  descriptionMarker: "Automatically scheduled by Journey Christian Ministries.",
  missedServiceGraceMinutes: 150,
  checkFunction: "maintainJourneyLivestreamSchedule",
});

/**
 * Public, read-only status endpoint for the Journey website.
 * Deploy this script as a web app that executes as the channel owner.
 */
function doGet(event) {
  if (event && event.parameter && event.parameter.view === "archive") {
    return jsonResponse_(JSON.stringify(buildPublicVideoArchive_()));
  }

  const cache = CacheService.getScriptCache();
  const cached = cache.get("journey-youtube-live-status");
  if (cached) return jsonResponse_(cached);

  let payload;
  try {
    const active = listBroadcasts_("active");
    const upcoming = findNextAdvertisedBroadcast_(listBroadcasts_("upcoming"));

    payload = active.length
      ? {
          live: true,
          videoId: active[0].id,
          title: active[0].snippet.title,
          upcoming: upcoming ? publicBroadcast_(upcoming) : null,
        }
      : {
          live: false,
          upcoming: upcoming ? publicBroadcast_(upcoming) : null,
        };
  } catch (error) {
    console.error("Unable to check Journey's live status: " + error);
    payload = { live: false };
  }

  const body = JSON.stringify(payload);
  cache.put("journey-youtube-live-status", body, 20);
  return jsonResponse_(body);
}

function jsonResponse_(body) {
  return ContentService.createTextOutput(body).setMimeType(
    ContentService.MimeType.JSON
  );
}

/**
 * Returns every public uploaded video and completed livestream on the channel.
 * Scheduled and currently-live broadcasts are intentionally omitted because the
 * website displays those through the default live/upcoming response instead.
 */
function buildPublicVideoArchive_() {
  const channelResponse = YouTube.Channels.list("contentDetails", {
    mine: true,
    maxResults: 1,
  });
  const channels = channelResponse.items || [];
  if (!channels.length) {
    throw new Error("Unable to find the Journey YouTube channel.");
  }

  const uploadsPlaylistId =
    channels[0].contentDetails &&
    channels[0].contentDetails.relatedPlaylists &&
    channels[0].contentDetails.relatedPlaylists.uploads;
  if (!uploadsPlaylistId) {
    throw new Error("Unable to find the Journey uploads playlist.");
  }

  const videoIds = listUploadVideoIds_(uploadsPlaylistId);
  const videos = [];

  for (let index = 0; index < videoIds.length; index += 50) {
    const response = YouTube.Videos.list(
      "id,snippet,status,liveStreamingDetails",
      {
        id: videoIds.slice(index, index + 50).join(","),
        maxResults: 50,
      }
    );

    (response.items || []).forEach(function (video) {
      if (isPublicArchiveVideo_(video)) videos.push(publicArchiveVideo_(video));
    });
  }

  videos.sort(function (left, right) {
    return new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime();
  });

  return {
    videos: videos,
    count: videos.length,
    generatedAt: new Date().toISOString(),
  };
}

function listUploadVideoIds_(uploadsPlaylistId) {
  const videoIds = [];
  let pageToken;

  do {
    const request = {
      playlistId: uploadsPlaylistId,
      maxResults: 50,
    };
    if (pageToken) request.pageToken = pageToken;

    const response = YouTube.PlaylistItems.list("contentDetails", request);
    (response.items || []).forEach(function (item) {
      const videoId = item.contentDetails && item.contentDetails.videoId;
      if (videoId) videoIds.push(videoId);
    });
    pageToken = response.nextPageToken;
  } while (pageToken);

  return videoIds;
}

function isPublicArchiveVideo_(video) {
  if (!video || !video.id || video.id === "LNgmOhf7Rh0") return false;
  if (!video.status || video.status.privacyStatus !== "public") return false;

  const liveDetails = video.liveStreamingDetails || {};
  const isUnfinishedLivestream =
    (liveDetails.scheduledStartTime || liveDetails.actualStartTime) &&
    !liveDetails.actualEndTime;
  return !isUnfinishedLivestream;
}

function publicArchiveVideo_(video) {
  const snippet = video.snippet || {};
  const liveDetails = video.liveStreamingDetails || {};
  const thumbnails = snippet.thumbnails || {};
  const thumbnail = thumbnails.maxres ||
    thumbnails.standard ||
    thumbnails.high ||
    thumbnails.medium ||
    thumbnails.default;

  return {
    videoId: video.id,
    title: snippet.title || "Journey Christian Ministries",
    publishedAt: liveDetails.actualStartTime || snippet.publishedAt,
    thumbnailUrl: thumbnail ? thumbnail.url : null,
    type: liveDetails.actualEndTime ? "livestream" : "upload",
  };
}

/** Logs a concise archive summary without changing YouTube. */
function previewJourneyVideoArchive() {
  const archive = buildPublicVideoArchive_();
  console.log(
    JSON.stringify(
      {
        count: archive.count,
        firstFive: archive.videos.slice(0, 5),
      },
      null,
      2
    )
  );
  return archive;
}

/**
 * Run this once while signed in to Journey's YouTube-owning Google account.
 * It installs one hourly trigger and immediately repairs the current schedule.
 */
function setupJourneyLivestreamScheduler() {
  removeSchedulerTriggers_();
  ScriptApp.newTrigger(JOURNEY_SCHEDULE.checkFunction)
    .timeBased()
    .everyHours(1)
    .create();

  const result = maintainJourneyLivestreamSchedule();
  console.log(JSON.stringify(result));
  return result;
}

/**
 * Keeps exactly one next Journey service advertised on YouTube.
 * Completed broadcasts remain in the channel archive. A missed upcoming
 * broadcast is moved forward after the grace period instead of remaining stale.
 */
function maintainJourneyLivestreamSchedule() {
  const now = new Date();
  const upcoming = listBroadcasts_("upcoming");
  const managed = upcoming.find(isManagedBroadcast_);

  let target;
  if (managed && isStillUsable_(managed, now)) {
    target = serviceFromDate_(new Date(managed.snippet.scheduledStartTime));
  } else {
    target = getNextServiceAfter_(now);
  }

  const matching = upcoming.find(function (broadcast) {
    return isMatchingService_(broadcast, target);
  });
  const broadcast = managed || matching;

  if (!broadcast) {
    const created = YouTube.LiveBroadcasts.insert(
      buildBroadcastResource_(null, target),
      "snippet,status,contentDetails"
    );
    clearLiveStatusCache_();
    return summarize_("created", created);
  }

  if (isConfiguredFor_(broadcast, target)) {
    return summarize_("already-current", broadcast);
  }

  const updated = YouTube.LiveBroadcasts.update(
    buildBroadcastResource_(broadcast.id, target),
    "snippet,status,contentDetails"
  );
  clearLiveStatusCache_();
  return summarize_("updated", updated);
}

/** Removes only this scheduler's clock triggers; it does not delete videos. */
function disableJourneyLivestreamScheduler() {
  removeSchedulerTriggers_();
  console.log("Journey livestream scheduler disabled.");
}

/** Returns the next six service dates for a quick setup-time sanity check. */
function previewJourneyLivestreamSchedule() {
  const services = [];
  let cursor = new Date();

  for (let index = 0; index < 6; index += 1) {
    const service = getNextServiceAfter_(cursor);
    services.push({
      title: service.title,
      scheduledStartTime: service.start.toISOString(),
      detroitTime: Utilities.formatDate(
        service.start,
        JOURNEY_SCHEDULE.timeZone,
        "EEEE, MMMM d, yyyy 'at' h:mm a z"
      ),
    });
    cursor = new Date(service.start.getTime() + 60 * 1000);
  }

  console.log(JSON.stringify(services, null, 2));
  return services;
}

function removeSchedulerTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === JOURNEY_SCHEDULE.checkFunction) {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

function listBroadcasts_(broadcastStatus) {
  const response = YouTube.LiveBroadcasts.list(
    "id,snippet,status,contentDetails",
    {
      broadcastStatus: broadcastStatus,
      broadcastType: "event",
      maxResults: 50,
    }
  );
  return response.items || [];
}

function findNextAdvertisedBroadcast_(broadcasts) {
  return broadcasts
    .filter(function (broadcast) {
      return isManagedBroadcast_(broadcast) || isSundayBroadcast_(broadcast);
    })
    .sort(function (left, right) {
      return (
        new Date(left.snippet.scheduledStartTime).getTime() -
        new Date(right.snippet.scheduledStartTime).getTime()
      );
    })[0];
}

function isSundayBroadcast_(broadcast) {
  if (!broadcast || !broadcast.snippet) return false;
  return (
    broadcast.snippet.title === JOURNEY_SCHEDULE.sundayTitle &&
    isJourneyServiceTime_(new Date(broadcast.snippet.scheduledStartTime))
  );
}

function publicBroadcast_(broadcast) {
  return {
    videoId: broadcast.id,
    title: broadcast.snippet.title,
    scheduledStartTime: broadcast.snippet.scheduledStartTime,
  };
}

function clearLiveStatusCache_() {
  CacheService.getScriptCache().remove("journey-youtube-live-status");
}

function isManagedBroadcast_(broadcast) {
  const description =
    broadcast && broadcast.snippet && broadcast.snippet.description;
  return Boolean(
    description &&
      description.indexOf(JOURNEY_SCHEDULE.descriptionMarker) !== -1
  );
}

function isStillUsable_(broadcast, now) {
  const start = new Date(broadcast.snippet.scheduledStartTime);
  const graceStart = new Date(
    now.getTime() - JOURNEY_SCHEDULE.missedServiceGraceMinutes * 60 * 1000
  );
  return start >= graceStart && isJourneyServiceTime_(start);
}

function isMatchingService_(broadcast, service) {
  if (!broadcast || !broadcast.snippet) return false;
  const start = new Date(broadcast.snippet.scheduledStartTime);
  return (
    broadcast.snippet.title === service.title &&
    Math.abs(start.getTime() - service.start.getTime()) < 60 * 1000
  );
}

function isConfiguredFor_(broadcast, service) {
  if (!isMatchingService_(broadcast, service)) return false;

  const details = broadcast.contentDetails || {};
  const status = broadcast.status || {};
  return (
    isManagedBroadcast_(broadcast) &&
    status.privacyStatus === "public" &&
    details.enableAutoStart === true &&
    details.enableAutoStop === true &&
    details.recordFromStart === true
  );
}

function buildBroadcastResource_(id, service) {
  const description =
    "Join Journey Christian Ministries for Sunday Worship live from Detroit, Michigan.";

  const resource = {
    snippet: {
      title: service.title,
      description:
        description + "\n\n" + JOURNEY_SCHEDULE.descriptionMarker,
      scheduledStartTime: service.start.toISOString(),
    },
    status: {
      privacyStatus: "public",
      selfDeclaredMadeForKids: false,
    },
    contentDetails: {
      enableAutoStart: true,
      enableAutoStop: true,
      enableDvr: true,
      recordFromStart: true,
      latencyPreference: "normal",
      monitorStream: {
        enableMonitorStream: false,
      },
    },
  };

  if (id) resource.id = id;
  return resource;
}

function getNextServiceAfter_(after) {
  const halfHour = 30 * 60 * 1000;
  let cursor = new Date(Math.ceil((after.getTime() + 1000) / halfHour) * halfHour);

  for (let index = 0; index < 16 * 48; index += 1) {
    if (isJourneyServiceTime_(cursor)) return serviceFromDate_(cursor);
    cursor = new Date(cursor.getTime() + halfHour);
  }

  throw new Error("Unable to calculate the next Journey service.");
}

function isJourneyServiceTime_(date) {
  const dayName = Utilities.formatDate(
    date,
    JOURNEY_SCHEDULE.timeZone,
    "EEE"
  );
  const time = Utilities.formatDate(
    date,
    JOURNEY_SCHEDULE.timeZone,
    "HH:mm"
  );

  return dayName === "Sun" && time === "10:00";
}

function serviceFromDate_(date) {
  return {
    title: JOURNEY_SCHEDULE.sundayTitle,
    start: date,
  };
}

function summarize_(action, broadcast) {
  return {
    action: action,
    broadcastId: broadcast.id,
    title: broadcast.snippet.title,
    scheduledStartTime: broadcast.snippet.scheduledStartTime,
    detroitTime: Utilities.formatDate(
      new Date(broadcast.snippet.scheduledStartTime),
      JOURNEY_SCHEDULE.timeZone,
      "EEEE, MMMM d, yyyy 'at' h:mm a z"
    ),
  };
}
