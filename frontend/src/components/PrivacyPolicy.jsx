import { Link } from 'react-router-dom'
import './PrivacyPolicy.css'
import SiteFooter from './common/SiteFooter'

function PrivacyPolicy() {
  return (
    <div className="privacy-policy-page">
      <div className="container">
        <header className="header">
          <Link to="/" className="back-link">
            ← Back to Home
          </Link>
          <h1 className="page-title">Privacy Policy</h1>
        </header>

        <main className="privacy-content">
          <div className="last-updated">
            <p>
              <strong>Last updated:</strong> July 29, 2025
            </p>
          </div>

          <section className="policy-section">
            <h2>Introduction</h2>
            <p>
              Welcome to Empowered Indian ("we," "our," or "us"). We are committed to protecting
              your privacy and being transparent about how we collect, use, and share your
              information. This Privacy Policy describes our practices in connection with our
              website and services.
            </p>
          </section>

          <section className="policy-section">
            <h2>Information We Collect</h2>
            <h3>Information You Provide</h3>
            <ul>
              <li>Contact information when you reach out to us via social media or email</li>
              <li>Feedback and suggestions you share with us</li>
              <li>Any information you voluntarily provide when participating in our platform</li>
            </ul>

            <h3>Information Automatically Collected</h3>
            <ul>
              <li>Basic website analytics (page views, session duration, device type)</li>
              <li>Technical information (IP address, browser type, operating system)</li>
              <li>Cookies and similar tracking technologies for website functionality</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Improve our website and services</li>
              <li>Respond to your inquiries and feedback</li>
              <li>Communicate with you about our platform and updates</li>
              <li>Analyze usage patterns to enhance user experience</li>
              <li>Ensure the security and integrity of our services</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>Information Sharing</h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties. We may
              share information in the following limited circumstances:
            </p>
            <ul>
              <li>With your explicit consent</li>
              <li>To comply with legal obligations or respond to lawful requests</li>
              <li>To protect our rights, privacy, safety, or property</li>
              <li>In connection with a business transfer or acquisition</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your
              personal information against unauthorized access, alteration, disclosure, or
              destruction. However, no internet transmission is completely secure, and we cannot
              guarantee absolute security.
            </p>
          </section>

          <section className="policy-section">
            <h2>Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your personal information</li>
              <li>Object to or restrict certain processing activities</li>
              <li>Withdraw consent where processing is based on consent</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>Cookies</h2>
            <p>
              We use cookies and similar technologies to enhance your browsing experience, analyze
              site traffic, and understand where our visitors are coming from. You can control
              cookies through your browser settings.
            </p>
          </section>

          <section className="policy-section">
            <h2>Third-Party Services</h2>
            <p>
              Our website may contain links to third-party websites or services. We are not
              responsible for the privacy practices of these third parties. We encourage you to read
              their privacy policies.
            </p>
          </section>

          <section className="policy-section">
            <h2>Children's Privacy</h2>
            <p>
              Our services are not directed to children under 13. We do not knowingly collect
              personal information from children under 13. If you become aware that a child has
              provided us with personal information, please contact us.
            </p>
          </section>

          <section className="policy-section">
            <h2>Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes
              by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="policy-section">
            <h2>Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or our privacy practices, please
              contact us:
            </p>
            <ul>
              <li>
                Twitter:{' '}
                <a
                  href="https://twitter.com/roshanasingh6"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @roshanasingh6
                </a>
              </li>
              <li>
                Email: <a href="mailto:roshan@empoweredindian.in">roshan@empoweredindian.in</a>
              </li>
            </ul>
          </section>
        </main>
      </div>
      <SiteFooter />
    </div>
  )
}

export default PrivacyPolicy
