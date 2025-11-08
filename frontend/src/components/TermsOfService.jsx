import { Link } from 'react-router-dom'
import './TermsOfService.css'
import SiteFooter from './common/SiteFooter'

const TermsOfService = () => {
  return (
    <div className="tos-page">
      <div className="container">
        <header className="header">
          <Link to="/" className="back-link">
            ← Back to Home
          </Link>
          <h1 className="page-title">Terms of Service</h1>
        </header>

        <main className="tos-content">
          <div className="last-updated">
            <p>
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>
          </div>

          <section className="tos-section">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using the Empowered Indian MPLADS Dashboard ("Service"), you accept
              and agree to be bound by the terms and provisions of this agreement.
            </p>
          </section>

          <section className="tos-section">
            <h2>2. Use License</h2>
            <p>
              Permission is granted to temporarily access the Service for personal, non-commercial
              transitory viewing only. This is the grant of a license, not a transfer of title, and
              under this license you may not:
            </p>
            <ul>
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to reverse engineer any software contained on the Service</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
            </ul>
          </section>

          <section className="tos-section">
            <h2>3. Data and Information</h2>
            <p>
              The MPLADS data presented on this platform is sourced from official government portals
              and public records. While we strive for accuracy, we do not guarantee the completeness
              or accuracy of the information provided. Users should verify information independently
              for critical decisions.
            </p>
          </section>

          <section className="tos-section">
            <h2>4. Disclaimer</h2>
            <p>
              The materials on this Service are provided on an 'as is' basis. Empowered Indian makes
              no warranties, expressed or implied, and hereby disclaims and negates all other
              warranties including without limitation, implied warranties or conditions of
              merchantability, fitness for a particular purpose, or non-infringement of intellectual
              property or other violation of rights.
            </p>
          </section>

          <section className="tos-section">
            <h2>5. Limitations</h2>
            <p>
              In no event shall Empowered Indian or its suppliers be liable for any damages
              (including, without limitation, damages for loss of data or profit, or due to business
              interruption) arising out of the use or inability to use the Service, even if
              Empowered Indian or its authorized representative has been notified orally or in
              writing of the possibility of such damage.
            </p>
          </section>

          <section className="tos-section">
            <h2>6. Accuracy of Materials</h2>
            <p>
              The materials appearing on the Service could include technical, typographical, or
              photographic errors. Empowered Indian does not warrant that any of the materials on
              its Service are accurate, complete, or current. Empowered Indian may make changes to
              the materials contained on its Service at any time without notice.
            </p>
          </section>

          <section className="tos-section">
            <h2>7. Modifications</h2>
            <p>
              Empowered Indian may revise these terms of service for its Service at any time without
              notice. By using this Service, you are agreeing to be bound by the then current
              version of these terms of service.
            </p>
          </section>

          <section className="tos-section">
            <h2>8. Governing Law</h2>
            <p>
              These terms and conditions are governed by and construed in accordance with the laws
              of India and you irrevocably submit to the exclusive jurisdiction of the courts in
              that State or location.
            </p>
          </section>

          <section className="tos-section">
            <h2>9. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at{' '}
              <a href="mailto:roshan@empoweredindian.in">roshan@empoweredindian.in</a>.
            </p>
          </section>
        </main>
      </div>
      <SiteFooter />
    </div>
  )
}

export default TermsOfService
