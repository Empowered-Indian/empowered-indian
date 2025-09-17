import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import './Home.css'
import MailingListForm from './MPLADS/components/Common/MailingListForm'
import SiteFooter from './common/SiteFooter'

function Home() {
  useEffect(() => {
    const formatNumber = (n) => n.toLocaleString('en-IN')
    const counters = Array.from(document.querySelectorAll('.counter'))

    const animateCounter = (counter) => {
      const target = Number(counter.getAttribute('data-target')) || 0
      const duration = 1200
      const fps = 60
      const steps = Math.max(1, Math.round((duration / 1000) * fps))
      let current = 0
      const step = target / steps
      const id = setInterval(() => {
        current += step
        if (current >= target) {
          counter.textContent = formatNumber(Math.round(target))
          counter.setAttribute('aria-valuenow', Math.round(target))
          clearInterval(id)
        } else {
          counter.textContent = formatNumber(Math.floor(current))
          counter.setAttribute('aria-valuenow', Math.floor(current))
        }
      }, 1000 / fps)
    }

    // Intersection Observer for counters and reveal animations
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const el = entry.target
        if (entry.isIntersecting) {
          if (el.classList.contains('counter')) animateCounter(el)
          el.classList.add('is-visible')
          io.unobserve(el)
        }
      })
    }, { threshold: 0.4 })

    counters.forEach(c => {
      c.setAttribute('role', 'status')
      c.setAttribute('aria-live', 'polite')
      io.observe(c)
    })

    // elements
    const revealEls = Array.from(document.querySelectorAll('.reveal-on-scroll'))
    revealEls.forEach(el => io.observe(el))

    // Cleanup
    return () => io.disconnect()
  }, [])


  return (
    <div className="home-page">
      <section className="hero" role="banner" aria-label="MPLADS overview">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-text">Transparency in Action</span>
            </div>
            <h1 className="hero-title">
              <span className="hero-title-main">
                Empowered Indian
              </span>
            </h1>
            <span className="hero-title-sub">
              Making government data accessible, understandable, and actionable
            </span>

            <p className="hero-description">
              Track fund utilization, monitor project progress, and hold our representatives accountable.
            </p>

            <div className="hero-stats">
              <div className="stats-item">
                <div className="stats-icon">₹</div>
                <div className="stats-number">
                  <span className="counter" data-target="5000">5000</span>+ Cr
                </div>
                <div className="stats-label">Funds Tracked</div>
              </div>
              <div className="stats-item">
                <div className="stats-icon">🏛️</div>
                <div className="stats-number">
                  <span className="counter" data-target="543">543</span>
                </div>
                <div className="stats-label">MPs Monitored</div>
              </div>
              <div className="stats-item" role="group" aria-label="States covered">
                <div className="stats-icon">🗺️</div>
                <div className="stats-number">
                  <span className="counter" data-target="38">38</span>
                </div>
                <div className="stats-label">States Covered</div>
              </div>
              <div className="stats-item" role="group" aria-label="Projects tracked">
                <div className="stats-icon">📑</div>
                <div className="stats-number">
                  <span className="counter" data-target="10000">10000</span>+
                </div>
                <div className="stats-label">Projects Tracked</div>
              </div>
            </div>
          </div>

          <div className="status-section">
            <div>
              <div className="status-header">
                <h2 className="section-title">Available Dashboards</h2>
                <p className="section-subtitle">
                  Explore our comprehensive platforms for government transparency
                </p>
              </div>
              <div className="status-indicators">
                <div className="status-card available">
                  <div className="home-status-icon">📊</div>
                  <h3>MPLADS Dashboard</h3>
                  <p className="status-description">
                    Track MP fund utilization, project progress, and expenditure patterns across constituencies.
                  </p>
                  <Link to="/mplads" className="status-cta-button">
                    View Dashboard
                  </Link>
                </div>

                <div className="status-card wip">
                  <div className="home-status-icon">🚧</div>
                  <h3>MLALADS Dashboard</h3>
                  <p className="status-description">
                    MLA Local Area Development fund tracking - coming soon to provide state-level transparency.
                  </p>
                  <p className="status-label">Work in Progress</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="features-container">
          <h2 className="section-title">Powerful Features</h2>
          <p className="section-subtitle">
            Everything you need to understand and track government fund utilization
          </p>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Real-time Analytics</h3>
              <p>Track fund utilization, project status, and expenditure patterns with interactive charts and visualizations.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Advanced Search</h3>
              <p>Find specific MPs, constituencies, or projects with powerful search and filtering capabilities.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <h3>Performance Insights</h3>
              <p>Understand spending patterns, project completion rates, and fund utilization efficiency.</p>
            </div>
          </div>
        </div>
      </section>
      {/* Mission Section */}
      <section className="mission">
        <div className="mission-container">
          <div className="mission-content">
            <h2>Our Mission</h2>
            <p>
              To create a platform that makes government data accessible, understandable, and actionable for every Indian citizen.
              We believe in transparency, accountability, and the power of informed citizens to drive positive change.
            </p>
            <div className="mission-values">
              <div className="value-item">
                <div className="value-icon">🔍</div>
                <h4>Transparency</h4>
                <p>Making government spending visible and trackable</p>
              </div>
              <div className="value-item">
                <div className="value-icon">📊</div>
                <h4>Accountability</h4>
                <p>Holding representatives accountable for fund utilization</p>
              </div>
              <div className="value-item">
                <div className="value-icon">👥</div>
                <h4>Accessibility</h4>
                <p>Democratizing access to government data</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter">
        <div className="newsletter-container">
          <div className="newsletter-content">
            <h2>Stay Updated</h2>
            <p>
              Get the latest insights on government transparency and fund utilization.
              Subscribe to receive updates on new features and important data releases.
            </p>
            <MailingListForm />
          </div>
        </div>
      </section>

      <SiteFooter className="home-footer" />
    </div>
  )
}

export default Home;