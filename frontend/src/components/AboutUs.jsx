import { Link } from 'react-router-dom'
import './AboutUs.css'
import SiteFooter from './common/SiteFooter'

function AboutUs() {
  return (
    <div className="about-us-page">
      <div className="container">
        <header className="header">
          <Link to="/" className="back-link">
            ← Back to Home
          </Link>
          <h1 className="page-title">About Us</h1>
        </header>

        <main className="about-content">
          <section className="about-section intro">
            <p className="mission-statement">
              At <strong>Empowered Indian</strong>, we believe democracy works best when citizens
              have access to clear, reliable, and actionable information about their government. Our
              mission is simple yet ambitious: to make our government visible, searchable, and
              accountable.
            </p>
          </section>

          <section className="about-section">
            <h2>What We Do</h2>
            <p>
              We aggregate and present public data, from Parliament to Panchayats, in a way that's
              easy for anyone to explore. From tracking MPLADS and MLALADS fund utilization, to
              uncovering project progress, budgets, and key decision-makers, our platform transforms
              scattered data into transparent, interactive dashboards.
            </p>
            <p>
              We're not just building a website. We're building a civic movement. By combining open
              data, technology, and citizen participation, we aim to bridge the gap between
              government actions and public awareness.
            </p>
          </section>

          <section className="about-section">
            <h2>Our Vision</h2>
            <div className="vision-box">
              <p>
                An India where every citizen can hold their leaders accountable, track public
                spending, and contribute to building a transparent democracy.
              </p>
            </div>
          </section>

          <section className="about-section">
            <h2>Our Approach</h2>
            <div className="approach-grid">
              <div className="approach-item">
                <h3>Data Transparency</h3>
                <p>Aggregating official datasets and making them accessible to everyone.</p>
              </div>
              <div className="approach-item">
                <h3>Citizen Engagement</h3>
                <p>Providing tools to report, review, and collaborate on civic issues.</p>
              </div>
              <div className="approach-item">
                <h3>Actionable Insights</h3>
                <p>Turning raw numbers into stories that drive meaningful change.</p>
              </div>
            </div>
          </section>

          <section className="about-section">
            <h2>Who We Serve</h2>
            <p>
              Whether you're a concerned citizen, a journalist, a student, an RTI activist, or a
              researcher, Empowered Indian equips you with the tools to ask the right questions and
              demand better governance.
            </p>
            <ul>
              <li>
                <strong>Citizens:</strong> Track your MP's performance and local development
                projects
              </li>
              <li>
                <strong>Journalists:</strong> Access data-driven stories about government spending
                and accountability
              </li>
              <li>
                <strong>Researchers & Students:</strong> Analyze trends in governance and public
                policy
              </li>
              <li>
                <strong>RTI Activists:</strong> Find data patterns to guide targeted information
                requests
              </li>
              <li>
                <strong>Civil Society:</strong> Monitor government performance and advocate for
                transparency
              </li>
            </ul>
          </section>

          <section className="about-section">
            <h2>Our Current Focus: MPLADS Dashboard</h2>
            <p>
              Our first major initiative is the <Link to="/mplads">MPLADS Dashboard</Link>, which
              provides comprehensive analysis of the Member of Parliament Local Area Development
              Scheme. This tool allows you to:
            </p>
            <ul>
              <li>
                Track fund utilization across all 543 Lok Sabha and Rajya Sabha constituencies
              </li>
              <li>Compare MP performance and project completion rates</li>
              <li>Explore development projects by category and location</li>
              <li>Analyze spending patterns and identify trends</li>
              <li>Export data for further research and analysis</li>
            </ul>
          </section>

          <section className="about-section">
            <h2>Data Sources & Methodology</h2>
            <p>
              We source our data exclusively from official government portals and public datasets,
              including:
            </p>
            <ul>
              <li>Ministry of Statistics and Programme Implementation (MPLADS Portal)</li>
              <li>Election Commission of India</li>
              <li>Parliament of India databases</li>
              <li>State government transparency portals</li>
            </ul>
            <p>
              All data undergoes rigorous cleaning and standardization to ensure consistency and
              accuracy. We welcome feedback on our methodologies and are working to improve our data
              processing documentation.
            </p>
          </section>

          <section className="about-section">
            <h2>Technology & Platform</h2>
            <p>
              Empowered Indian is built on modern web technologies with a focus on performance,
              accessibility, and user experience. Our platform is designed to handle large datasets
              efficiently while providing an intuitive interface for citizens to explore government
              data.
            </p>
            <p>
              Our platform features real-time data processing, interactive visualizations, and
              robust API endpoints for developers and researchers who want to access structured
              government data.
            </p>
          </section>

          <section className="about-section">
            <h2>Future Roadmap</h2>
            <p>While we start with MPLADS, our vision extends far beyond. We're working on:</p>
            <ul>
              <li>
                <strong>MLALADS Dashboard:</strong> State-level MLA fund tracking
              </li>
              <li>
                <strong>Budget Tracker:</strong> Union and state budget allocation analysis
              </li>
              <li>
                <strong>Policy Impact Monitor:</strong> Tracking implementation of government
                schemes
              </li>
              <li>
                <strong>Constituency Report Cards:</strong> Comprehensive development scorecards
              </li>
              <li>
                <strong>Citizen Feedback Portal:</strong> Direct reporting and grievance tracking
              </li>
            </ul>
          </section>

          <section className="about-section">
            <h2>Get Involved</h2>
            <p>Empowered Indian is a community-driven initiative. We welcome contributions from:</p>
            <ul>
              <li>
                <strong>Data Enthusiasts:</strong> Help us identify new datasets and improve our
                analysis
              </li>
              <li>
                <strong>Developers:</strong> Use our APIs and suggest technical improvements
              </li>
              <li>
                <strong>Civic Activists:</strong> Share insights and help us prioritize features
              </li>
              <li>
                <strong>Researchers:</strong> Collaborate on studies and policy recommendations
              </li>
              <li>
                <strong>Citizens:</strong> Use our tools, share feedback, and spread awareness
              </li>
            </ul>
          </section>

          <section className="about-section">
            <h2>Contact & Connect</h2>
            <p>
              We'd love to hear from you. Whether you have questions, suggestions, or want to
              collaborate:
            </p>
            <ul className="contact-list">
              <li>
                Email: <a href="mailto:roshan@empoweredindian.in">roshan@empoweredindian.in</a>
              </li>
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
                For technical questions: Check our <Link to="/faq">FAQ section</Link>
              </li>
              <li>For media inquiries: Please reach out via email</li>
            </ul>
          </section>

          <section className="about-section call-to-action">
            <div className="cta-box">
              <h2>Together, We Can Make Accountability a Habit</h2>
              <p>
                Join us in building a more transparent India. Start by exploring our{' '}
                <Link to="/mplads" className="cta-link">
                  MPLADS Dashboard
                </Link>{' '}
                and discovering what your elected representatives are doing with public funds.
              </p>
              <p className="tagline">
                <strong>Empowered Indian</strong> — Because informed citizens build a stronger
                nation.
              </p>
            </div>
          </section>

          <div className="about-footer">
            <p>
              Learn more about our data practices in our{' '}
              <Link to="/privacy-policy">Privacy Policy</Link> and{' '}
              <Link to="/terms-of-service">Terms of Service</Link>.
            </p>
            <Link to="/" className="back-link-bottom">
              ← Return to Home
            </Link>
          </div>
        </main>
      </div>
      <SiteFooter />
    </div>
  )
}

export default AboutUs
