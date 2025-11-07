import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import './FAQ.css'
import SiteFooter from './common/SiteFooter'

function FAQ() {
  const [expandedValue, setExpandedValue] = useState('about')

  const handleExpandAll = () => {
    // Note: Radix Accordion with type="single" doesn't support multiple open items
    // We'll need to convert to type="multiple" to enable expand all functionality
    setExpandedValue('about') // For now, just open the first section
  }

  const handleCollapseAll = () => {
    setExpandedValue('')
  }

  return (
    <div className="faq-page">
      <div className="container">
        <header className="header">
          <Link to="/" className="back-link">← Back to Home</Link>
          <h1 className="page-title">Frequently Asked Questions</h1>
        </header>

        <main className="faq-content">
          <div className="faq-intro">
            <p>Click on any section below to expand and view detailed information.</p>
            <div className="faq-controls">
              <Button
                variant="outline"
                className="control-button"
                onClick={handleExpandAll}
              >
                Expand All
              </Button>
              <Button
                variant="outline"
                className="control-button"
                onClick={handleCollapseAll}
              >
                Collapse All
              </Button>
            </div>
          </div>

          <Accordion
            type="single"
            collapsible
            value={expandedValue}
            onValueChange={setExpandedValue}
            className="faq-accordion"
          >
            <AccordionItem value="about" className="faq-section">
              <AccordionTrigger className="section-header">
                <h2>About Empowered Indian</h2>
              </AccordionTrigger>
              <AccordionContent className="section-content">
                <div className="qa">
                  <h3>What is Empowered Indian?</h3>
                  <p>
                    Empowered Indian is a citizen-led effort to make government data visible, searchable, and actionable.
                    Our first release focuses on the MPLADS Dashboard to help you explore fund utilization and projects.
                  </p>
                </div>
                <div className="qa">
                  <h3>Is this an official government website?</h3>
                  <p>
                    No. This is an independent public-interest project that aggregates and visualizes data from official sources.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="understanding-mplads" className="faq-section">
              <AccordionTrigger className="section-header">
                <h2>Understanding MPLADS</h2>
              </AccordionTrigger>
              <AccordionContent className="section-content">
                <div className="qa">
                  <h3>What is MPLADS?</h3>
                  <p>
                    MPLADS (Member of Parliament Local Area Development Scheme) is a Central Government scheme that enables Members of Parliament to recommend works for development in their constituencies. It's designed to create durable community assets and infrastructure.
                  </p>
                </div>
                <div className="qa">
                  <h3>Who can participate in MPLADS?</h3>
                  <p>
                    All Members of Parliament (both Lok Sabha and Rajya Sabha) are eligible to participate. Lok Sabha MPs recommend works in their constituencies, while Rajya Sabha MPs can recommend works in any state they are elected from.
                  </p>
                </div>
                <div className="qa">
                  <h3>What are the major categories of permissible works under MPLADS?</h3>
                  <p>
                    Permissible works include: Public/community buildings, education infrastructure, public health facilities, drinking water/sanitation, irrigation/flood control, animal husbandry, agriculture, energy systems, roads/bridges, environment conservation, and sports/recreational facilities.
                  </p>
                </div>
                <div className="qa">
                  <h3>Who implements MPLADS projects?</h3>
                  <p>
                    District Collectors act as the nodal officers for MPLADS implementation. They coordinate with various implementing agencies like local bodies, government departments, and registered organizations to execute the recommended projects.
                  </p>
                </div>
                <div className="qa">
                  <h3>Can MPLADS funds be pooled with other government schemes?</h3>
                  <p>
                    Yes, MPLADS funds can be pooled with MGNREGA (for material component), Khelo India, and other Central/State schemes. MPLADS funds should be used last to fill gaps in the overall project funding.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="mplads-operations" className="faq-section">
              <AccordionTrigger className="section-header">
                <h2>MPLADS Operations & Rules</h2>
              </AccordionTrigger>
              <AccordionContent className="section-content">
                <div className="qa">
                  <h3>How much MPLADS fund does each MP receive annually?</h3>
                  <p>
                    Each MP receives ₹5 crores annually. This amount has evolved over time: it started with ₹5 lakh in 1993-94, increased to ₹1 crore in 1994-95, ₹2 crores in 1998-99, and ₹5 crores from 2011-12 onwards.
                  </p>
                </div>
                <div className="qa">
                  <h3>What happens if an MP serves less than a full year?</h3>
                  <p>
                    The allocation depends on service duration: Less than 3 months gets no allocation, 3 to 9 months gets 50% of annual allocation, and more than 9 months gets 100% of annual allocation.
                  </p>
                </div>
                <div className="qa">
                  <h3>What happened to MPLADS during COVID-19?</h3>
                  <p>
                    MPLADS was suspended from April 6, 2020 to November 9, 2021. No funds were allocated for FY 2020-21, and only ₹2 crores were allocated for the balance period of FY 2021-22.
                  </p>
                </div>
                <div className="qa">
                  <h3>What are the mandatory allocations for SC/ST development?</h3>
                  <p>
                    At least 15% of annual MPLADS entitlement must be used for SC (Scheduled Caste) areas and at least 7.5% for ST (Scheduled Tribe) areas. If there's insufficient ST population, funds can be used for SC areas and vice versa.
                  </p>
                </div>
                <div className="qa">
                  <h3>What is strictly NOT allowed under MPLADS?</h3>
                  <p>
                    Prohibited activities include: religious structures, residential buildings, commercial establishments, naming assets after people, grants/loans, land acquisition, recurring expenses, unauthorized colonies, welcome gates, and CSR pooling.
                  </p>
                </div>
                <div className="qa">
                  <h3>Can MPLADS funds be used for repair and renovation?</h3>
                  <p>
                    Yes, but limited to ₹50 lakhs per MP per year for all repairs/renovations combined, and only after a reasonable gap from original construction.
                  </p>
                </div>
                <div className="qa">
                  <h3>What's the minimum amount for any individual MPLADS work?</h3>
                  <p>
                    Normally ₹2.5 lakhs minimum, though District Authority can approve lower amounts with proper justification.
                  </p>
                </div>
                <div className="qa">
                  <h3>Can MPs fund projects outside their constituency?</h3>
                  <p>
                    Elected MPs can recommend works worth ₹25 lakhs per year outside their usual area. For natural calamities, they can contribute up to ₹1 crore anywhere in India. Nominated Rajya Sabha MPs can recommend works anywhere in the country.
                  </p>
                </div>
                <div className="qa">
                  <h3>How quickly must recommendations be processed?</h3>
                  <p>
                    District Authority must sanction or reject recommendations within 45 days of receipt (excluding model code of conduct periods). If documents from societies are not received within 1 month, the recommendation is cancelled.
                  </p>
                </div>
                <div className="qa">
                  <h3>What's the timeline for completing sanctioned works?</h3>
                  <p>
                    Generally within 1 year from sanction date. Exceptional cases (like hilly terrain) may take longer with proper justification. Works of ex-MPs must be completed within 18 months of demitting office.
                  </p>
                </div>
                <div className="qa">
                  <h3>Can registered societies and trusts receive MPLADS funding?</h3>
                  <p>
                    Yes, if registered for at least 3 years and engaged in social service, registered on NITI Aayog's Darpan Portal with Unique ID. Maximum ₹50 lakhs per MP per year, ₹1 crore per society during MP's entire term. Assets become government property.
                  </p>
                </div>
                <div className="qa">
                  <h3>How can MPLADS funds help during natural disasters?</h3>
                  <p>
                    Any MP can contribute up to ₹1 crore for "Calamity of Severe Nature" declared by Government of India. For state-declared calamities, MPs from that state can contribute up to ₹25 lakhs. Consent should be given within 90 days of calamity declaration.
                  </p>
                </div>
                <div className="qa">
                  <h3>How can citizens access information about MPLADS works?</h3>
                  <p>
                    Citizens can access MPLADS information through multiple channels: RTI Act 2005, district offices that display all work lists, Facilitation Centers in nodal districts, official websites like mplads.sbi.co.in, the official MPLADS portal at mplads.gov.in, and now through the Empowered Indian dashboard for comprehensive analysis and visualization.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="mplads-data" className="faq-section">
              <AccordionTrigger className="section-header">
                <h2>MPLADS Data & Dashboard</h2>
              </AccordionTrigger>
              <AccordionContent className="section-content">
                <div className="qa">
                  <h3>Where does the data come from?</h3>
                  <p>
                    Data is sourced from the official MPLADS portal (mplads.gov.in) and related public datasets. We process and standardize it for analysis, ensuring consistency across different data formats and time periods.
                  </p>
                </div>
                <div className="qa">
                  <h3>How often is the data updated?</h3>
                  <p>
                    The dashboard displays the last sync date in the footer. We fetch metadata from our backend and refresh it periodically based on updates from the official MPLADS portal.
                  </p>
                </div>
                <div className="qa">
                  <h3>Are there limitations to the data?</h3>
                  <p>
                    Yes. Government releases can have delays, gaps, or inconsistencies. We apply cleaning rules but cannot guarantee completeness or accuracy. Some historical data may be incomplete or formatted differently across time periods.
                  </p>
                </div>
                <div className="qa">
                  <h3>How is fund utilization calculated?</h3>
                  <p>
                    Fund utilization is calculated by summing the total amount of recommended works and completed works, then comparing this to the allocated funds. This metric helps assess how effectively MPs are using their MPLADS allocation for development projects.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="using-dashboard" className="faq-section">
              <AccordionTrigger className="section-header">
                <h2>Using the Dashboard</h2>
              </AccordionTrigger>
              <AccordionContent className="section-content">
                <div className="qa">
                  <h3>How do I find information for a particular MP or state?</h3>
                  <p>
                    Use the MPLADS dashboard navigation to browse by states and MPs, or use the search functionality. You can access detailed pages for individual MPs or states to view comprehensive performance metrics, project details, and expenditure patterns.
                  </p>
                </div>
                <div className="qa">
                  <h3>What do the charts and metrics mean?</h3>
                  <p>
                    Charts summarize sanctioned amounts, expenditures, project counts, and distribution across categories. Key metrics include fund utilization rates, project completion statistics, and category-wise spending. Hover over charts for exact values and detailed tooltips.
                  </p>
                </div>
                <div className="qa">
                  <h3>Can I download or export the data?</h3>
                  <p>
                    Export functionality is available for various data sets through the dashboard. You can download CSV files for MP details, expenditure data, and project information. Additional export options may be available via our API endpoints.
                  </p>
                </div>
                <div className="qa">
                  <h3>How can I compare different MPs or states?</h3>
                  <p>
                    Use the comparison features in the dashboard to analyze performance across different MPs, states, or time periods. You can compare metrics like fund utilization, project completion rates, and category-wise spending patterns.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="understanding-metrics" className="faq-section">
              <AccordionTrigger className="section-header">
                <h2>Understanding the Metrics</h2>
              </AccordionTrigger>
              <AccordionContent className="section-content">
                <div className="qa">
                  <h3>What is considered a "completed" project?</h3>
                  <p>
                    A completed project is one that has been fully executed and handed over for use. The completion status is based on reports from implementing agencies and district administration to the MPLADS portal.
                  </p>
                </div>
                <div className="qa">
                  <h3>Why might some MPs show low utilization rates?</h3>
                  <p>
                    Low utilization could indicate various factors: recent election (new MP), complex project approvals, local administrative delays, or strategic planning for larger multi-year projects. It's important to consider these contextual factors when analyzing utilization rates.
                  </p>
                </div>
                <div className="qa">
                  <h3>How are project costs determined?</h3>
                  <p>
                    Project costs are based on estimates provided during the recommendation phase and actual expenditure reported during implementation. Costs may vary from initial estimates due to material price changes, project modifications, or additional requirements during execution.
                  </p>
                </div>
                <div className="qa">
                  <h3>What does "allocated" vs "sanctioned" mean?</h3>
                  <p>
                    "Allocated" refers to the annual budget allocation to each MP (₹5 crores). "Sanctioned" refers to the approved amount for specific projects after technical and administrative clearances.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="data-quality" className="faq-section">
              <AccordionTrigger className="section-header">
                <h2>Data Quality & Accuracy</h2>
              </AccordionTrigger>
              <AccordionContent className="section-content">
                <div className="qa">
                  <h3>How accurate is the expenditure data?</h3>
                  <p>
                    Expenditure data is sourced from official MPLADS reports but may have reporting delays or discrepancies. We process and clean the data to improve consistency, but some variations from official sources may exist due to different reporting timelines.
                  </p>
                </div>
                <div className="qa">
                  <h3>I found an error in the data. How can I report it?</h3>
                  <p>
                    Please share specific details (MP name, constituency, project details, expected vs. actual values) via our contact channels below. Include screenshots and URLs where possible. We'll investigate and correct verified discrepancies.
                  </p>
                </div>
                <div className="qa">
                  <h3>Why might project counts differ from official sources?</h3>
                  <p>
                    Project counts may vary due to different counting methodologies (individual vs. grouped projects), data processing time differences, or consolidation of multi-phase projects. We aim for consistency but acknowledge these variations.
                  </p>
                </div>
                <div className="qa">
                  <h3>Do you accept feature requests?</h3>
                  <p>
                    Yes! We're building in public and appreciate suggestions for new views, filters, analysis features, and additional datasets. Share your ideas through our contact channels.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="technical-api" className="faq-section">
              <AccordionTrigger className="section-header">
                <h2>Technical & API Access</h2>
              </AccordionTrigger>
              <AccordionContent className="section-content">
                <div className="qa">
                  <h3>Is there an API available for developers?</h3>
                  <p>
                    Yes, we provide API endpoints for accessing MPLADS data programmatically. API documentation with available endpoints, rate limits, and usage guidelines is not yet publicly available. Please reach out to us via the contact channels below if you need API access, and we'll provide the necessary documentation and guidance.
                  </p>
                </div>
                <div className="qa">
                  <h3>Can I use this data for research or journalism?</h3>
                  <p>
                    Absolutely! This data is intended for public use. We encourage researchers, journalists, and citizens to use this information for analysis, reporting, and advocacy. Please cite "Empowered Indian" as your data source.
                  </p>
                </div>
                <div className="qa">
                  <h3>What browsers are supported?</h3>
                  <p>
                    The dashboard works best on modern browsers including Chrome, Firefox, Safari, and Edge. We recommend using the latest versions for optimal performance and security.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="privacy-security" className="faq-section">
              <AccordionTrigger className="section-header">
                <h2>Privacy & Security</h2>
              </AccordionTrigger>
              <AccordionContent className="section-content">
                <div className="qa">
                  <h3>Do you track user activity?</h3>
                  <p>
                    We use basic analytics to improve the user experience and understand usage patterns. No personal data is sold or shared with third parties. See our <Link to="/privacy-policy">Privacy Policy</Link> for complete details.
                  </p>
                </div>
                <div className="qa">
                  <h3>Is my data safe when using this platform?</h3>
                  <p>
                    We apply industry-standard security practices including HTTPS, secure headers, input validation, and regular security updates. Your privacy and data security are our priorities.
                  </p>
                </div>
                <div className="qa">
                  <h3>Do you store personal information?</h3>
                  <p>
                    We do not collect or store personal information beyond basic usage analytics. All MPLADS data displayed is public information already available through government sources.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="contact-section">
            <h2>Contact</h2>
            <p>
              For questions, media, or collaborations:
            </p>
            <ul className="contact-list">
              <li>Twitter: <a href="https://twitter.com/roshanasingh6" target="_blank" rel="noopener noreferrer">@roshanasingh6</a></li>
              <li>Email: <a href="mailto:roshan@empoweredindian.in">roshan@empoweredindian.in</a></li>
            </ul>
          </div>

          <div className="faq-footer">
            <p>
              Looking for legal terms? Read our <Link to="/terms-of-service">Terms of Service</Link>.
            </p>
            <Link to="/" className="back-link-bottom">← Return to Home</Link>
          </div>
        </main>
      </div>
      <SiteFooter />
    </div>
  )
}

export default FAQ
