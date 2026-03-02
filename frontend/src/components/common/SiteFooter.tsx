import { Link } from 'react-router-dom'
import { Github, Twitter, Mail, Heart, ExternalLink } from 'lucide-react'
import './SiteFooter.css'

const SiteFooter = ({ extraInfo, className = '', showFaq = true }) => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={`site-footer ${className}`.trim()}>
      <div className="footer-container">
        {/* Main Footer Content */}
        <div className="footer-grid">
          {/* Brand Column */}
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <span className="footer-logo-text">Empowered Indian</span>
            </Link>
            <p className="footer-tagline">
              Making government data accessible, understandable, and actionable for every citizen.
            </p>
            <div className="footer-social">
              <a
                href="https://twitter.com/empaboroshan"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                aria-label="Twitter"
              >
                <Twitter size={18} />
              </a>
              <a
                href="https://github.com/empowered-indian"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                aria-label="GitHub"
              >
                <Github size={18} />
              </a>
              <a
                href="mailto:contact@empoweredindian.in"
                className="social-link"
                aria-label="Email"
              >
                <Mail size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-links-group">
            <h4 className="footer-heading">Platform</h4>
            <ul className="footer-links">
              <li>
                <Link to="/mplads">MPLADS Dashboard</Link>
              </li>
              <li>
                <Link to="/mplads/states">Browse States</Link>
              </li>
              <li>
                <Link to="/mplads/mps">Browse MPs</Link>
              </li>
              <li>
                <Link to="/mplads/compare">Compare MPs</Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="footer-links-group">
            <h4 className="footer-heading">Company</h4>
            <ul className="footer-links">
              <li>
                <Link to="/about-us">About Us</Link>
              </li>
              {showFaq && (
                <li>
                  <Link to="/faq">FAQ</Link>
                </li>
              )}
              <li>
                <Link to="/privacy-policy">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/terms-of-service">Terms of Service</Link>
              </li>
            </ul>
          </div>

          {/* Sponsor */}
          <div className="footer-links-group">
            <h4 className="footer-heading">Supported By</h4>
            <a
              href="https://www.malpaniventures.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-sponsor"
            >
              <span className="sponsor-name">Malpani Ventures</span>
              <ExternalLink size={14} />
            </a>
            <p className="sponsor-description">
              Funded as a social impact initiative
            </p>
          </div>
        </div>

        {extraInfo && <p className="footer-extra">{extraInfo}</p>}

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            © {currentYear} Empowered Indian. All rights reserved.
          </p>
          <p className="footer-made-with">
            Made with <Heart size={14} className="heart-icon" /> for India
          </p>
        </div>
      </div>
    </footer>
  )
}

export default SiteFooter
