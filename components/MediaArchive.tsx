"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Category, MediaItem } from "@/lib/media";

type FilterKey = "all" | Category | "live";

type ModalState =
  | { type: "video"; videoId: string; title: string }
  | { type: "live" }
  | null;

const YOUTUBE_CHANNEL_VIDEOS_URL =
  "https://www.youtube.com/@JourneyChristianMinistries/videos";
const YOUTUBE_CHANNEL_LIVE_URL =
  "https://www.youtube.com/@JourneyChristianMinistries/live";
const UPCOMING_EVENT = {
  videoId: "1GQSuklWyxA",
  title: "Sunday Worship",
  date: "September 27, 2026",
  time: "10:00 AM Eastern",
};

const filters: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All Media" },
  { key: "sunday", label: "Sunday Worship" },
  { key: "wednesday", label: "Wisdom Wednesdays" },
  { key: "live", label: "Watch Live" },
];

export default function MediaArchive({ items }: { items: MediaItem[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [modal, setModal] = useState<ModalState>(null);
  const [liveVideoId, setLiveVideoId] = useState<string | null>(null);
  const [liveStatusKnown, setLiveStatusKnown] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const openModal = useCallback((state: ModalState, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setModal(state);
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (modal) closeButtonRef.current?.focus();
  }, [modal]);

  useEffect(() => {
    if (!modal) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [modal, closeModal]);

  useEffect(() => {
    let cancelled = false;

    async function checkYouTubeLive() {
      try {
        const response = await fetch("/api/youtube-live", { cache: "no-store" });
        if (!response.ok) throw new Error("Unable to check YouTube live status");

        const status = (await response.json()) as {
          live: boolean;
          videoId?: string;
        };

        if (!cancelled) {
          setLiveVideoId(status.live && status.videoId ? status.videoId : null);
          setLiveStatusKnown(true);
        }
      } catch {
        if (!cancelled) setLiveStatusKnown(true);
      }
    }

    void checkYouTubeLive();
    const timer = window.setInterval(checkYouTubeLive, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const showLive = filter === "all" || filter === "live";
  const visibleItems =
    filter === "all"
      ? items
      : filter === "live"
        ? []
        : items.filter((item) => item.category === filter);

  return (
    <>
      <div className="filters" role="tablist" aria-label="Filter media">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`filter${filter === f.key ? " active" : ""}`}
            aria-pressed={filter === f.key}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="archive-top">
        <div>
          <p className="eyebrow" style={{ marginBottom: 4 }}>
            Watch Anytime
          </p>
          <h2 style={{ margin: 0, color: "var(--deep)", fontSize: "1.9rem" }}>
            Recent Media
          </h2>
        </div>
        <a href={YOUTUBE_CHANNEL_VIDEOS_URL} target="_blank" rel="noopener noreferrer">
          Complete YouTube archive ↗
        </a>
      </div>

      <div className="media-grid">
        {showLive && liveVideoId && (
          <article className="media-card" data-cat="live">
            <button
              type="button"
              className="thumb live-thumb"
              onClick={(e) => openModal({ type: "live" }, e.currentTarget)}
            >
              <span className="next">Live Now</span>
              <span className="live-word">Journey Live</span>
            </button>
            <div className="media-body">
              <span className="tag">Live Now</span>
              <h3>Journey Livestream</h3>
              <div className="meta">Watch the current broadcast</div>
            </div>
          </article>
        )}

        {showLive && !liveVideoId && (
          <article className="media-card" data-cat="live">
            <a
              className="thumb"
              href={`https://www.youtube.com/watch?v=${UPCOMING_EVENT.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Watch ${UPCOMING_EVENT.title} on YouTube`}
            >
              <img
                src={`https://img.youtube.com/vi/${UPCOMING_EVENT.videoId}/hqdefault.jpg`}
                alt={`${UPCOMING_EVENT.title} video thumbnail`}
              />
              <span className="shade" />
              <span className="next">Next Broadcast</span>
              <span className="play" />
            </a>
            <div className="media-body">
              <span className="tag">Upcoming</span>
              <h3>{UPCOMING_EVENT.title}</h3>
              <div className="meta">
                {UPCOMING_EVENT.date} • {UPCOMING_EVENT.time}
              </div>
            </div>
          </article>
        )}

        {visibleItems.map((item) => (
          <article key={item.id} className="media-card" data-cat={item.category}>
            <button
              type="button"
              className="thumb"
              onClick={(e) =>
                openModal(
                  { type: "video", videoId: item.videoId, title: item.title },
                  e.currentTarget
                )
              }
            >
              <img
                src={`https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`}
                alt={`${item.title} video thumbnail`}
                loading="lazy"
              />
              <span className="shade" />
              <span className="play" />
            </button>
            <div className="media-body">
              <span className="tag">{item.tag}</span>
              {item.latest && <span className="latest">LATEST</span>}
              <h3>{item.title}</h3>
              <div className="meta">{item.date}</div>
            </div>
          </article>
        ))}
      </div>

      {modal && (
        <div
          className="modal open"
          role="dialog"
          aria-modal="true"
          aria-labelledby="media-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="dialog">
            <div className="modal-head">
              <span id="media-modal-title">
                {modal.type === "video" ? modal.title : "Journey Livestream"}
              </span>
              <button
                type="button"
                className="close"
                aria-label="Close"
                ref={closeButtonRef}
                onClick={closeModal}
              >
                ×
              </button>
            </div>
            {modal.type === "video" ? (
              <div className="video">
                <iframe
                  title={modal.title}
                  src={`https://www.youtube.com/embed/${modal.videoId}?autoplay=1`}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : liveVideoId ? (
              <div className="video">
                <iframe
                  title="Journey Christian Ministries livestream"
                  src={`https://www.youtube.com/embed/${liveVideoId}?autoplay=1`}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="offline">
                <p className="eyebrow" style={{ color: "#8ee6ff" }}>
                  {liveStatusKnown ? "Next Broadcast" : "Checking Livestream"}
                </p>
                <h2>
                  {liveStatusKnown
                    ? "Journey isn’t live right now."
                    : "Checking YouTube…"}
                </h2>
                <p>Join us Sundays at 10:00 AM and Wednesdays at 7:00 PM.</p>
                <a
                  href={YOUTUBE_CHANNEL_LIVE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open Journey on YouTube ↗
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
