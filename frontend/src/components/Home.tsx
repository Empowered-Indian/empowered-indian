import { Link } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import {
  IndianRupee,
  Landmark,
  Map,
  FileStack,
  BarChart3,
  Construction,
  Search,
  TrendingUp,
  Users,
  ArrowRight,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import './Home.css'
import MailingListForm from './MPLADS/components/Common/MailingListForm'
import SiteFooter from './common/SiteFooter'
import { Button } from '@/components/ui/button'

function Home() {
  const heroRef = useRef(null)

  useEffect(() => {
    const formatNumber = n => n.toLocaleString('en-IN')
    const counters = Array.from(document.querySelectorAll('.counter'))

    const animateCounter = counter => {
      const target = Number(counter.getAttribute('data-target')) || 0
      const duration = 1500
      const fps = 60
      const steps = Math.max(1, Math.round((duration / 1000) * fps))
      let current = 0
      const step = target / steps
      const id = setInterval(() => {
        current += step
        if (current >= target) {
          counter.textContent = formatNumber(Math.round(target))
          clearInterval(id)
        } else {
          counter.textContent = formatNumber(Math.floor(current))
        }
      }, 1000 / fps)
    }

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const el = entry.target
          if (entry.isIntersecting) {
            if (el.classList.contains('counter')) animateCounter(el)
            el.classList.add('is-visible')
            io.unobserve(el)
          }
        })
      },
      { threshold: 0.2 }
    )

    counters.forEach(c => {
      c.setAttribute('role', 'status')
      c.setAttribute('aria-live', 'polite')
      io.observe(c)
    })

    const revealEls = Array.from(document.querySelectorAll('.reveal-on-scroll'))
    revealEls.forEach(el => io.observe(el))

    return () => io.disconnect()
  }, [])

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero" ref={heroRef} role="banner" aria-label="MPLADS overview">
        <div className="hero-bg-pattern" aria-hidden="true">
          <div className="hero-gradient-orb hero-gradient-orb-1"></div>
          <div className="hero-gradient-orb hero-gradient-orb-2"></div>
          <div className="hero-grid-lines"></div>
        </div>

        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-eyebrow reveal-on-scroll">
              <Sparkles size={14} />
              <span>Government Transparency Platform</span>
            </div>

            <h1 className="hero-title reveal-on-scroll">
              <span className="hero-title-line">Empowered</span>
              <span className="hero-title-line hero-title-accent">Indian</span>
            </h1>

            <p className="hero-tagline reveal-on-scroll">
              Making government data accessible, understandable, and actionable for every citizen
            </p>

            <p className="hero-description reveal-on-scroll">
              Track fund utilization, monitor project progress, and hold our representatives
              accountable. Democracy works best when citizens are informed.
            </p>

            <div className="hero-cta reveal-on-scroll">
              <Link to="/mplads">
                <Button className="hero-btn-primary">
                  <span>Explore MPLADS Data</span>
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <Link to="/about">
                <Button variant="outline" className="hero-btn-secondary">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="hero-stats-wrapper reveal-on-scroll">
            <div className="hero-stats">
              <div className="stat-card">
                <div className="stat-icon">
                  <IndianRupee size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">
                    <span className="counter" data-target="5000">0</span>
                    <span className="stat-suffix">+ Cr</span>
                  </div>
                  <div className="stat-label">Funds Tracked</div>
                </div>
                <div className="stat-glow"></div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <Landmark size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">
                    <span className="counter" data-target="543">0</span>
                  </div>
                  <div className="stat-label">MPs Monitored</div>
                </div>
                <div className="stat-glow"></div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <Map size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">
                    <span className="counter" data-target="38">0</span>
                  </div>
                  <div className="stat-label">States & UTs</div>
                </div>
                <div className="stat-glow"></div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <FileStack size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">
                    <span className="counter" data-target="10000">0</span>
                    <span className="stat-suffix">+</span>
                  </div>
                  <div className="stat-label">Projects Tracked</div>
                </div>
                <div className="stat-glow"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboards Section */}
      <section className="dashboards-section">
        <div className="dashboards-container">
          <div className="section-header reveal-on-scroll">
            <span className="section-label">Platforms</span>
            <h2 className="section-title">Available Dashboards</h2>
            <p className="section-subtitle">
              Explore our comprehensive platforms for government transparency
            </p>
          </div>

          <div className="dashboards-grid">
            <div className="dashboard-card dashboard-card-primary reveal-on-scroll">
              <div className="dashboard-card-header">
                <div className="dashboard-icon">
                  <BarChart3 size={32} />
                </div>
                <span className="dashboard-status dashboard-status-live">Live</span>
              </div>
              <h3 className="dashboard-title">MPLADS Dashboard</h3>
              <p className="dashboard-description">
                Track MP fund utilization, project progress, and expenditure patterns across all
                543 constituencies.
              </p>
              <ul className="dashboard-features">
                <li><ChevronRight size={14} /> Real-time fund tracking</li>
                <li><ChevronRight size={14} /> Project status monitoring</li>
                <li><ChevronRight size={14} /> MP performance analytics</li>
              </ul>
              <Link to="/mplads" className="dashboard-link">
                <Button className="dashboard-btn">
                  <span>View Dashboard</span>
                  <ArrowRight size={16} />
                </Button>
              </Link>
            </div>

            <div className="dashboard-card dashboard-card-secondary reveal-on-scroll">
              <div className="dashboard-card-header">
                <div className="dashboard-icon dashboard-icon-muted">
                  <Construction size={32} />
                </div>
                <span className="dashboard-status dashboard-status-wip">Coming Soon</span>
              </div>
              <h3 className="dashboard-title">MLALADS Dashboard</h3>
              <p className="dashboard-description">
                MLA Local Area Development fund tracking — bringing state-level transparency to
                every citizen.
              </p>
              <ul className="dashboard-features dashboard-features-muted">
                <li><ChevronRight size={14} /> State-wise fund allocation</li>
                <li><ChevronRight size={14} /> MLA performance metrics</li>
                <li><ChevronRight size={14} /> Local project insights</li>
              </ul>
              <div className="dashboard-coming-soon">
                <div className="coming-soon-bar"></div>
                <span>In Development</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <div className="section-header reveal-on-scroll">
            <span className="section-label">Capabilities</span>
            <h2 className="section-title">Powerful Features</h2>
            <p className="section-subtitle">
              Everything you need to understand and track government fund utilization
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-item reveal-on-scroll">
              <div className="feature-icon-wrapper">
                <BarChart3 size={28} />
              </div>
              <div className="feature-content">
                <h3 className="feature-title">Real-time Analytics</h3>
                <p className="feature-description">
                  Track fund utilization, project status, and expenditure patterns with
                  interactive charts and visualizations.
                </p>
              </div>
              <div className="feature-number">01</div>
            </div>

            <div className="feature-item reveal-on-scroll">
              <div className="feature-icon-wrapper">
                <Search size={28} />
              </div>
              <div className="feature-content">
                <h3 className="feature-title">Advanced Search</h3>
                <p className="feature-description">
                  Find specific MPs, constituencies, or projects with powerful search and
                  filtering capabilities.
                </p>
              </div>
              <div className="feature-number">02</div>
            </div>

            <div className="feature-item reveal-on-scroll">
              <div className="feature-icon-wrapper">
                <TrendingUp size={28} />
              </div>
              <div className="feature-content">
                <h3 className="feature-title">Performance Insights</h3>
                <p className="feature-description">
                  Understand spending patterns, project completion rates, and fund utilization
                  efficiency.
                </p>
              </div>
              <div className="feature-number">03</div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="mission-section">
        <div className="mission-bg-pattern" aria-hidden="true"></div>
        <div className="mission-container">
          <div className="mission-content reveal-on-scroll">
            <span className="section-label section-label-light">Our Purpose</span>
            <h2 className="mission-title">
              Empowering Citizens Through
              <span className="mission-title-highlight"> Transparency</span>
            </h2>
            <p className="mission-text">
              We believe in the power of informed citizens to drive positive change. Our platform
              makes government data accessible, understandable, and actionable for every Indian.
            </p>
          </div>

          <div className="mission-values">
            <div className="value-card reveal-on-scroll">
              <div className="value-icon">
                <Search size={24} />
              </div>
              <h4 className="value-title">Transparency</h4>
              <p className="value-description">
                Making government spending visible and trackable for every citizen
              </p>
            </div>

            <div className="value-card reveal-on-scroll">
              <div className="value-icon">
                <BarChart3 size={24} />
              </div>
              <h4 className="value-title">Accountability</h4>
              <p className="value-description">
                Holding representatives accountable for public fund utilization
              </p>
            </div>

            <div className="value-card reveal-on-scroll">
              <div className="value-icon">
                <Users size={24} />
              </div>
              <h4 className="value-title">Accessibility</h4>
              <p className="value-description">
                Democratizing access to government data for informed decision-making
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter-section">
        <div className="newsletter-container">
          <div className="newsletter-content reveal-on-scroll">
            <span className="section-label">Stay Connected</span>
            <h2 className="newsletter-title">Get Updates</h2>
            <p className="newsletter-text">
              Subscribe to receive the latest insights on government transparency, new features,
              and important data releases.
            </p>
            <div className="newsletter-form-wrapper">
              <MailingListForm />
            </div>
          </div>
        </div>
      </section>

      <SiteFooter className="home-footer" />
    </div>
  )
}

export default Home
