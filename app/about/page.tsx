import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Journey Christian Ministries — a welcoming, Christ-centered church family in Detroit, Michigan.",
  openGraph: {
    title: "About",
    description:
      "Learn about Journey Christian Ministries — a welcoming, Christ-centered church family in Detroit, Michigan.",
  },
};

export default function AboutPage() {
  return (
    <div className="page">
      <div className="eyebrow">About</div>
      <h1 className="page-title">About Journey Christian Ministries</h1>
      <div className="about">
        <section>
          <h2 className="about-subhead">Our Story</h2>
          <p>
            Journey Christian Ministries was founded in 2020 during the height
            of the COVID-19 pandemic. At a time when many churches were closing
            their doors and moving exclusively online, Pastor Deshawn Tatum was
            led by God to move forward in faith and establish a new ministry.
          </p>
          <p>
            What began during a season of uncertainty has grown into a church
            committed to sharing God&rsquo;s Word, serving the community, and
            welcoming people from every walk of life.
          </p>

          <h2 className="about-subhead">A Bible-Teaching Church</h2>
          <p>
            Journey Christian Ministries is a Bible-teaching church within the
            Church of God in Christ (COGIC). We believe in teaching the Word of
            God in a way that is clear, practical, and applicable to everyday
            life.
          </p>
          <p>
            No matter where you are in life or on your spiritual journey, you
            are welcome here. You do not have to have everything figured out
            before coming to God. We believe God will meet you right where you
            are and guide you forward.
          </p>

          <h2 className="about-subhead">Serving Our Community</h2>
          <p>
            Giving back is an important part of who we are. Journey Christian
            Ministries is committed to supporting local families and creating
            meaningful opportunities to serve our community.
          </p>
          <p>
            Through outreach efforts such as our annual back-to-school supply
            giveaways, we work to meet practical needs while demonstrating the
            love of Christ.
          </p>

          <h2 className="about-subhead">You Are Welcome Here</h2>
          <p>
            Whether you are beginning your relationship with God, returning to
            church, or looking for a church family where you can continue
            growing, there is a place for you at Journey Christian Ministries.
          </p>
          <p>
            Come as you are. God will meet you where you are, and your journey
            can begin today.
          </p>
        </section>

        <section className="mission">
          <h2 className="mission-title">Our Mission</h2>
          <p>
            Everyone has a journey, and no two journeys look the same. Our
            mission is to meet people where they are, help them grow in faith,
            and equip them to apply the Word of God to everyday life. Through
            biblical teaching, genuine fellowship, and service to our community,
            we walk alongside people as they discover God&rsquo;s purpose for
            their lives and move forward on their journey with Christ.
          </p>
        </section>
      </div>
    </div>
  );
}
