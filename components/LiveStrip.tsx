"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Service schedule in America/Detroit local time.
// weekday: 0 = Sunday, 3 = Wednesday (JS getDay convention).
const SERVICES = [
  { weekday: 0, startMinutes: 10 * 60 }, // Sunday Worship 10:00 AM
  { weekday: 3, startMinutes: 19 * 60 }, // Wednesday Bible Study 7:00 PM
];

const BEFORE_MIN = 10; // show 10 minutes before start
const WINDOW_MIN = 180; // 3-hour service window after start

// Returns true when "now" (in America/Detroit) is within
// [start - 10min, start + 180min] for any service. DST is handled
// automatically by resolving the wall-clock time in the church's timezone.
function isLiveNow(): boolean {
  const detroitNow = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Detroit" })
  );
  const day = detroitNow.getDay();
  const minutes = detroitNow.getHours() * 60 + detroitNow.getMinutes();

  return SERVICES.some((s) => {
    if (s.weekday !== day) return false;
    return (
      minutes >= s.startMinutes - BEFORE_MIN &&
      minutes <= s.startMinutes + WINDOW_MIN
    );
  });
}

export default function LiveStrip() {
  // Default hidden so nothing flashes before hydration.
  const [live, setLive] = useState(false);

  useEffect(() => {
    const update = () => setLive(isLiveNow());
    update();
    const id = setInterval(update, 30 * 1000);
    return () => clearInterval(id);
  }, []);

  if (!live) return null;

  return (
    <div className="live-strip">
      <div>
        <div className="live-pill">
          <span className="dot" aria-hidden="true" />
          LIVE NOW
        </div>
        <h3>When Journey is live, watch from here.</h3>
        <p>
          A service is streaming now — join us live from Journey Christian
          Ministries.
        </p>
      </div>
      <div className="buttons">
        <Link className="btn primary" href="/watch">
          Watch Live
        </Link>
      </div>
    </div>
  );
}
