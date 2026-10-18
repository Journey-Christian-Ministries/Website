import Image from "next/image";
import HomeLiveIndicator from "@/components/HomeLiveIndicator";
import { siteConfig } from "@/lib/site";

export default function HomePage() {
  return (
    <>
      <section className="hero" id="join">
        <h1>
          Welcome to <span className="accent">Journey</span>
        </h1>
        <div className="hero-copy">
          <p className="subtitle">
            A Christ-centered church family where faith grows, lives are
            strengthened, and people are welcomed with love as they walk with
            God.
          </p>
          <div className="schedule">
            <div className="timeblock">
              <h3>Sunday Worship</h3>
              <strong>10:00 AM</strong>
              <div className="icons">
                <div>
                  <span className="icon" aria-hidden="true">
                    🏛️
                  </span>
                  In Person
                </div>
                <div>
                  <span className="icon" aria-hidden="true">
                    💻
                  </span>
                  Live Online
                </div>
              </div>
            </div>
            <div className="timeblock">
              <h3>Wednesday Bible Study</h3>
              <strong>7:00 PM</strong>
              <div className="icons">
                <div>
                  <span className="icon" aria-hidden="true">
                    💻
                  </span>
                  Live Online Only
                </div>
              </div>
            </div>
          </div>
          <HomeLiveIndicator />
        </div>
        <div className="hero-photo">
          <Image
            className="pastors"
            src="/pastors.png"
            alt="Pastor and First Lady of Journey Christian Ministries"
            width={1440}
            height={802}
            priority
            sizes="(max-width: 900px) 100vw, 50vw"
          />
        </div>
      </section>

      <section className="flow" id="about">
        <h2 className="section-title">Take the journey with us.</h2>
        <div className="columns">
          <div className="copy">
            <p>
              <span className="highlight">Journey Christian Ministries</span> is
              a place for worship, teaching, prayer, and encouragement. Whether
              you are joining in person on Sunday or connecting online during the
              week, you are welcome here.
            </p>
            <p>
              Our website is your central place for service times, live
              streaming, prayer requests, online giving, and staying connected
              with Journey Christian Ministries.
            </p>
          </div>
          <div className="details">
            <div className="detail-line">
              <b>Location</b>
              <span>{siteConfig.addressLine}.</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
