import { Link } from 'react-router-dom'
import './SiteFooter.css'

const SiteFooter = ({ extraInfo, className = '', showFaq = true }) => {
  return (
    <footer className={`site-footer ${className}`.trim()}>
      <div className="footer-container">
        {extraInfo ? <p>{extraInfo}</p> : null}
        <p>© 2025 Empowered Indian • Making government data accessible</p>
        <p>
          Funded as a social impact initiative by{' '}
          <a href="https://www.malpaniventures.com/" target="_blank" rel="noopener noreferrer">
            Malpani Ventures
          </a>
        </p>
        <p>
          <Link to="/about-us">About Us</Link> •{' '}
          {showFaq && (
            <>
              <Link to="/faq">FAQ</Link> •{' '}
            </>
          )}
          <Link to="/privacy-policy">Privacy Policy</Link> •{' '}
          <Link to="/terms-of-service">Terms of Service</Link>
        </p>
      </div>
    </footer>
  )
}

export default SiteFooter
