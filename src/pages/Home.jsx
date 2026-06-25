import { Link } from 'react-router-dom'
import WaveDivider from '../components/WaveDivider'

export default function Home() {
  return (
    <>
      <section className="hero container">
        <div>
          <p className="eyebrow">Physiotherapy, built around your movement</p>
          <h1>Move without limits again.</h1>
          <p className="hero__subhead">
            One-on-one assessment, hands-on treatment, and an exercise plan
            you can actually follow between visits — all in one place.
          </p>
          <div className="hero__actions">
            <Link to="/book" className="btn btn--primary">Book a Visit</Link>
            <Link to="/services" className="btn btn--secondary">View Services</Link>
          </div>
        </div>
        <div className="hero__art">
          <svg viewBox="0 0 300 220" aria-hidden="true">
            <path
              className="hero__art-path"
              d="M20,160 C70,40 110,200 150,90 C190,10 220,140 280,60"
            />
            <circle className="hero__art-dot" cx="20" cy="160" r="6" />
            <circle className="hero__art-dot" cx="280" cy="60" r="6" />
          </svg>
        </div>
      </section>

      <WaveDivider />

      <section className="container">
        <div className="value-props">
          <div className="value-prop">
            <h3>Hands-on assessment</h3>
            <p>We watch how you move before we decide how to treat it — not the other way around.</p>
          </div>
          <div className="value-prop">
            <h3>A plan built for you</h3>
            <p>Every exercise plan is matched to your injury and tracked in one place, not handed out on paper.</p>
          </div>
          <div className="value-prop">
            <h3>Progress you can see</h3>
            <p>Log pain levels and completed exercises between visits. Your therapist sees it too.</p>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="cta-band">
          <h2>Ready to move better?</h2>
          <p>Book your first assessment and leave with a plan you understand.</p>
          <Link to="/book" className="btn btn--primary">Book a Visit</Link>
        </div>
      </section>
    </>
  )
}
