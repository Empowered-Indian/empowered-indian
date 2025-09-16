import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import './Home.css'
import MailingListForm from './MPLADS/components/Common/MailingListForm'
import SiteFooter from './common/SiteFooter'

function Home() {
  useEffect(() => {
    // Counter animation (improved: throttled + formatted)
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

  useEffect(() => {
    const hero = document.querySelector('.hero')
    if (!hero) return
    const handleMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 100
      const y = (e.clientY / window.innerHeight) * 100
      hero.style.setProperty('--mouse-x', `${x}%`)
      hero.style.setProperty('--mouse-y', `${y}%`)
    }
    hero.addEventListener('mousemove', handleMove)
    return () => hero.removeEventListener('mousemove', handleMove)
  }, [])

  return (
    <div className="home-page">
      <section className="hero" role="banner" aria-label="MPLADS overview">
        <div className="hero-background">
          <div className="hero-pattern"></div>
          <div className="floating-particles">
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
          </div>
          <div className="cyber-grid"></div>
        </div>
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-text">🚀 Next-Gen Transparency</span>
            </div>

            <h1 className="hero-title" aria-hidden="false">
              <span className="hero-title-main">
                <span className="text-gradient">Empowered</span>
                <span className="text-gradient">Indian</span>
              </span>
            </h1>
            <span className="hero-title-sub">
              <span data-text="Transparency in Action">Transparency in Action</span>
            </span>

            <p className="hero-description">
              Making government data accessible, understandable, and actionable for every Indian citizen.
              Track fund utilization, monitor project progress, and hold our representatives accountable.
            </p>

            <div className="hero-stats">
              <div className="stats-item" role="group" aria-label="MPLADS funds tracked">
                <div className="stats-icon">₹</div>
                <div className="stats-number" aria-hidden="false">
                  <span className="counter" data-target="5000">5000</span>+ Cr
                </div>
                <div className="stats-label">Funds Tracked</div>
              </div>
              <div className="stats-item" role="group" aria-label="MPs monitored">
                <div className="stats-icon">🏛️</div>
                <div className="stats-number">
                  <span className="counter" data-target="543">543</span>+
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
              <div className="stats-item" role="group" aria-label="Report Downloaded">
                <div className="stats-icon">📥</div>
                <div className="stats-number">
                  <span className="counter" data-target="500">500</span>+
                </div>
                <div className="stats-label">Report Downloaded</div>
              </div>
              <div className="stats-item" role="group" aria-label="User Visited">
                <div className="stats-icon">👥</div>
                <div className="stats-number">
                  <span className="counter" data-target="1000">1000</span>+
                </div>
                <div className="stats-label">User Visited</div>
              </div>
            </div>

            <div className="hero-actions">
              <Link to="/mplads" className="hero-cta primary" aria-label="Explore dashboard">
                <span className="cta-text">Explore Dashboard</span>
                <div className="cta-glow" aria-hidden />
              </Link>
              <button className="hero-cta secondary" onClick={() => document.querySelector('.features').scrollIntoView({ behavior: 'smooth' })}>
                <span className="cta-text">Learn More</span>
              </button>
            </div>
          </div>
          <div className="status-indicators">
            <div className="status-card available">
              <div className="status-icon">📊</div>
              <h3>MPLADS Dashboard</h3>
              <p className="status-description">
                Track MP fund utilization, project progress, and expenditure patterns across constituencies.
              </p>
              <Link to="/mplads" className="status-cta-button">
                View Dashboard
              </Link>
            </div>

            <div className="status-card wip">
              <div className="status-icon">🚧</div>
              <h3>MLALADS Dashboard</h3>
              <p className="status-description">
                MLA Local Area Development fund tracking - coming soon to provide state-level transparency.
              </p>              
              <p className="status-label">Work in Progress</p>
            </div>
          </div>
        </div>
      </section>

      <section className="features" aria-labelledby="features-heading">
        <div className="features-container">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <div className="icon-bg">📊</div>
                <div className="icon-pulse"></div>
              </div>
              <h3>Real-time Analytics</h3>
              <p>Track fund utilization, project status, and expenditure patterns with interactive charts and visualizations.</p>
              <ul className="feature-list">
                <li><span className="list-icon">⚡</span>Live fund tracking</li>
                <li><span className="list-icon">📈</span>Project progress monitoring</li>
                <li><span className="list-icon">🔍</span>Comparative analysis</li>
              </ul>
              <div className="feature-glow"></div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <div className="icon-bg">🔍</div>
                <div className="icon-pulse"></div>
              </div>
              <h3>Advanced Search</h3>
              <p>Find specific MPs, constituencies, or projects with powerful search and filtering capabilities.</p>
              <ul className="feature-list">
                <li><span className="list-icon">🎯</span>MP and constituency search</li>
                <li><span className="list-icon">🔧</span>Project filtering</li>
                <li><span className="list-icon">🗺️</span>State-wise analysis</li>
              </ul>
              <div className="feature-glow"></div>
            </div>

            <div className="feature-card">
              <div className="card-glow"></div>
              <div className="card-border"></div>
              <div className="feature-icon">
                <div className="icon-bg">📈</div>
                <div className="icon-pulse"></div>
              </div>
              <h3>Performance Insights</h3>
              <p>Understand spending patterns, project completion rates, and fund utilization efficiency.</p>
              <ul className="feature-list">
                <li><span className="list-icon">📊</span>Performance metrics</li>
                <li><span className="list-icon">📈</span>Trend analysis</li>
                <li><span className="list-icon">⚡</span>Efficiency indicators</li>
              </ul>
              <div className="feature-glow"></div>
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
            <h2>Stay Informed</h2>
            <p>
              Subscribe to receive new feature launches, data insights, and transparency reports —
              thoughtfully curated and sent occasionally. No spam, unsubscribe anytime.
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