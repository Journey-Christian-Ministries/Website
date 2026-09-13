const JOURNEY_SCHEDULE = Object.freeze({
  timeZone: "America/Detroit",
  sundayTitle: "Sunday Worship",
  wednesdayTitle: "Wisdom Wednesdays",
  descriptionMarker: "Automatically scheduled by Journey Christian Ministries.",
  legacyBroadcastId: "LNgmOhf7Rh0",
  missedServiceGraceMinutes: 150,
  checkFunction: "maintainJourneyLivestreamSchedule",
});

/**
 * Public, read-only status endpoint for the Journey website.
 * Deploy this script as a web app that executes as the channel owner.
 */
function doGet() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get("journey-youtube-live-status");
  if (cached) return jsonResponse_(cached);

  let payload;
  try {
    const active = listBroadcasts_("active");
    payload = active.length
      ? { live: true, videoId: active[0].id }
      : { live: false };
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
  const active = listBroadcasts_("active");

  if (active.length > 0) {
    return {
      action: "active-broadcast-left-unchanged",
      broadcastId: active[0].id,
      title: active[0].snippet.title,
    };
  }

  const upcoming = listBroadcasts_("upcoming");
  const managed = upcoming.find(isManagedBroadcast_);
  const legacy = upcoming.find(function (broadcast) {
    return broadcast.id === JOURNEY_SCHEDULE.legacyBroadcastId;
  });

  let target;
  if (managed && isStillUsable_(managed, now)) {
    target = serviceFromDate_(new Date(managed.snippet.scheduledStartTime));
  } else {
    target = getNextServiceAfter_(now);
  }

  const matching = upcoming.find(function (broadcast) {
    return isMatchingService_(broadcast, target);
  });
  const broadcast = managed || matching || legacy;

  if (!broadcast) {
    const created = YouTube.LiveBroadcasts.insert(
      buildBroadcastResource_(null, target),
      "snippet,status,contentDetails"
    );
    return summarize_("created", created);
  }

  if (isConfiguredFor_(broadcast, target)) {
    return summarize_("already-current", broadcast);
  }

  const updated = YouTube.LiveBroadcasts.update(
    buildBroadcastResource_(broadcast.id, target),
    "snippet,status,contentDetails"
  );
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
    details.enableEmbed === true &&
    details.recordFromStart === true
  );
}

function buildBroadcastResource_(id, service) {
  const isSunday = service.title === JOURNEY_SCHEDULE.sundayTitle;
  const description = isSunday
    ? "Join Journey Christian Ministries for Sunday Worship live from Detroit, Michigan."
    : "Join Journey Christian Ministries for Wisdom Wednesdays Bible Study live from Detroit, Michigan.";

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
      enableEmbed: true,
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

  if (dayName === "Sun" && time === "10:00") return true;

  if (dayName === "Wed" && time === "19:00") {
    const dayOfMonth = Number(
      Utilities.formatDate(date, JOURNEY_SCHEDULE.timeZone, "d")
    );
    const occurrence = Math.ceil(dayOfMonth / 7);
    return occurrence !== 4;
  }

  return false;
}

function serviceFromDate_(date) {
  const dayName = Utilities.formatDate(
    date,
    JOURNEY_SCHEDULE.timeZone,
    "EEE"
  );
  return {
    title:
      dayName === "Sun"
        ? JOURNEY_SCHEDULE.sundayTitle
        : JOURNEY_SCHEDULE.wednesdayTitle,
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
