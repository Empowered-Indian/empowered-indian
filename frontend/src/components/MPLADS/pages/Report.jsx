import { useState } from 'react'
import { FiAlertTriangle, FiMessageSquare, FiSend, FiCheck, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { sanitizeInput, sanitizeEmail } from '../../../utils/inputSanitization'
import { API_BASE_URL } from '../../../utils/constants/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import './Report.css'

const Report = () => {
  const [activeTab, setActiveTab] = useState('feedback')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Feedback form state
  const [feedbackForm, setFeedbackForm] = useState({
    type: 'general',
    title: '',
    description: '',
    category: 'general',
    contactEmail: '',
    priority: 'medium',
  })

  // Data issue form state
  const [dataIssueForm, setDataIssueForm] = useState({
    issueType: 'incorrect_data',
    description: '',
    location: '',
    mpName: '',
    workId: '',
    expectedValue: '',
    actualValue: '',
    contactEmail: '',
  })

  const submitFeedback = async formData => {
    try {
      const response = await fetch(`${API_BASE_URL}/feedback/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Feedback submitted successfully!')
        setFeedbackForm({
          type: 'general',
          title: '',
          description: '',
          category: 'general',
          contactEmail: '',
          priority: 'medium',
        })
      } else {
        throw new Error(result.message || 'Failed to submit feedback')
      }
    } catch (error) {
      toast.error('Failed to submit feedback. Please try again.')
      console.error('Error submitting feedback:', error)
    }
  }

  const submitDataIssue = async formData => {
    try {
      const response = await fetch(`${API_BASE_URL}/feedback/report-data-issue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Data issue reported successfully!')
        setDataIssueForm({
          issueType: 'incorrect_data',
          description: '',
          location: '',
          mpName: '',
          workId: '',
          expectedValue: '',
          actualValue: '',
          contactEmail: '',
        })
      } else {
        throw new Error(result.message || 'Failed to report issue')
      }
    } catch (error) {
      toast.error('Failed to report issue. Please try again.')
      console.error('Error reporting data issue:', error)
    }
  }

  const handleFeedbackSubmit = async e => {
    e.preventDefault()
    if (!feedbackForm.title.trim() || !feedbackForm.description.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    await submitFeedback(feedbackForm)
    setIsSubmitting(false)
  }

  const handleDataIssueSubmit = async e => {
    e.preventDefault()
    if (!dataIssueForm.description.trim()) {
      toast.error('Please describe the data issue')
      return
    }

    setIsSubmitting(true)
    await submitDataIssue(dataIssueForm)
    setIsSubmitting(false)
  }

  return (
    <div className="report-page">
      <div className="report-header">
        <h1>Report an Issue</h1>
        <p>Help us improve by reporting data issues or providing feedback</p>
      </div>

      <div className="report-tabs">
        <Button
          variant={activeTab === 'feedback' ? 'default' : 'ghost'}
          className={`tab-button gap-2 ${activeTab === 'feedback' ? 'active' : ''}`}
          onClick={() => setActiveTab('feedback')}
        >
          <FiMessageSquare />
          General Feedback
        </Button>
        <Button
          variant={activeTab === 'data-issue' ? 'default' : 'ghost'}
          className={`tab-button gap-2 ${activeTab === 'data-issue' ? 'active' : ''}`}
          onClick={() => setActiveTab('data-issue')}
        >
          <FiAlertTriangle />
          Report Data Issue
        </Button>
      </div>

      <div className="report-content">
        {activeTab === 'feedback' && (
          <form className="feedback-form" onSubmit={handleFeedbackSubmit}>
            <div className="form-section">
              <h3>Submit Feedback</h3>
              <p>
                Share your experience, suggestions, or report bugs to help us improve the MPLADS
                dashboard.
              </p>
            </div>

            <div className="form-row">
              <div className="form-group">
                <Label htmlFor="feedback-type">Feedback Type *</Label>
                <Select
                  value={feedbackForm.type}
                  onValueChange={value => setFeedbackForm({ ...feedbackForm, type: value })}
                  required
                >
                  <SelectTrigger id="feedback-type">
                    <SelectValue placeholder="Select feedback type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Feedback</SelectItem>
                    <SelectItem value="bug">Bug Report</SelectItem>
                    <SelectItem value="feature_request">Feature Request</SelectItem>
                    <SelectItem value="data_issue">Data Issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="form-group">
                <Label htmlFor="feedback-category">Category *</Label>
                <Select
                  value={feedbackForm.category}
                  onValueChange={value => setFeedbackForm({ ...feedbackForm, category: value })}
                  required
                >
                  <SelectTrigger id="feedback-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="mp">MP Information</SelectItem>
                    <SelectItem value="work">Works/Projects</SelectItem>
                    <SelectItem value="expenditure">Expenditure Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="form-group">
              <Label htmlFor="feedback-title">Title *</Label>
              <Input
                type="text"
                id="feedback-title"
                value={feedbackForm.title}
                onChange={e =>
                  setFeedbackForm({ ...feedbackForm, title: sanitizeInput(e.target.value) })
                }
                placeholder="Brief summary of your feedback"
                required
              />
            </div>

            <div className="form-group">
              <Label htmlFor="feedback-description" className="flex justify-between items-center">
                <span>Description *</span>
                <span className="char-count text-xs font-normal">
                  {feedbackForm.description.length}/1000
                </span>
              </Label>
              <Textarea
                id="feedback-description"
                value={feedbackForm.description}
                onChange={e =>
                  setFeedbackForm({
                    ...feedbackForm,
                    description: sanitizeInput(e.target.value, { maxLength: 1000 }),
                  })
                }
                placeholder="Please provide detailed information about your feedback"
                rows={6}
                maxLength={1000}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <Label htmlFor="feedback-priority">Priority</Label>
                <Select
                  value={feedbackForm.priority}
                  onValueChange={value => setFeedbackForm({ ...feedbackForm, priority: value })}
                >
                  <SelectTrigger id="feedback-priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="form-group">
                <Label htmlFor="feedback-email">Contact Email (Optional)</Label>
                <Input
                  type="email"
                  id="feedback-email"
                  value={feedbackForm.contactEmail}
                  onChange={e =>
                    setFeedbackForm({
                      ...feedbackForm,
                      contactEmail: sanitizeEmail(e.target.value),
                    })
                  }
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="default"
              className="submit-button gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="loading-spinner"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <FiSend />
                  Submit Feedback
                </>
              )}
            </Button>
          </form>
        )}

        {activeTab === 'data-issue' && (
          <form className="data-issue-form" onSubmit={handleDataIssueSubmit}>
            <div className="form-section">
              <h3>Report Data Issue</h3>
              <p>
                Found incorrect, missing, or outdated information? Help us maintain accurate data by
                reporting issues.
              </p>
            </div>

            <div className="form-group">
              <Label htmlFor="issue-type">Issue Type *</Label>
              <Select
                value={dataIssueForm.issueType}
                onValueChange={value => setDataIssueForm({ ...dataIssueForm, issueType: value })}
                required
              >
                <SelectTrigger id="issue-type">
                  <SelectValue placeholder="Select issue type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incorrect_data">Incorrect Data</SelectItem>
                  <SelectItem value="missing_data">Missing Data</SelectItem>
                  <SelectItem value="outdated_data">Outdated Data</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="form-group">
              <Label htmlFor="issue-description" className="flex justify-between items-center">
                <span>Issue Description *</span>
                <span className="char-count text-xs font-normal">
                  {dataIssueForm.description.length}/1000
                </span>
              </Label>
              <Textarea
                id="issue-description"
                value={dataIssueForm.description}
                onChange={e =>
                  setDataIssueForm({
                    ...dataIssueForm,
                    description: sanitizeInput(e.target.value, { maxLength: 1000 }),
                  })
                }
                placeholder="Describe the data issue in detail"
                rows={5}
                maxLength={1000}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <Label htmlFor="issue-location">Location (State/Constituency)</Label>
                <Input
                  type="text"
                  id="issue-location"
                  value={dataIssueForm.location}
                  onChange={e =>
                    setDataIssueForm({ ...dataIssueForm, location: sanitizeInput(e.target.value) })
                  }
                  placeholder="e.g., Maharashtra, Mumbai North"
                />
              </div>

              <div className="form-group">
                <Label htmlFor="issue-mp">MP Name</Label>
                <Input
                  type="text"
                  id="issue-mp"
                  value={dataIssueForm.mpName}
                  onChange={e =>
                    setDataIssueForm({ ...dataIssueForm, mpName: sanitizeInput(e.target.value) })
                  }
                  placeholder="Name of the MP (if relevant)"
                />
              </div>
            </div>

            <div className="form-group">
              <Label htmlFor="issue-work-id">Work/Project ID (if applicable)</Label>
              <Input
                type="text"
                id="issue-work-id"
                value={dataIssueForm.workId}
                onChange={e =>
                  setDataIssueForm({ ...dataIssueForm, workId: sanitizeInput(e.target.value) })
                }
                placeholder="Project or work reference ID"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <Label htmlFor="expected-value">Expected/Correct Value</Label>
                <Input
                  type="text"
                  id="expected-value"
                  value={dataIssueForm.expectedValue}
                  onChange={e =>
                    setDataIssueForm({
                      ...dataIssueForm,
                      expectedValue: sanitizeInput(e.target.value),
                    })
                  }
                  placeholder="What the correct data should be"
                />
              </div>

              <div className="form-group">
                <Label htmlFor="actual-value">Current/Incorrect Value</Label>
                <Input
                  type="text"
                  id="actual-value"
                  value={dataIssueForm.actualValue}
                  onChange={e =>
                    setDataIssueForm({
                      ...dataIssueForm,
                      actualValue: sanitizeInput(e.target.value),
                    })
                  }
                  placeholder="What is currently displayed"
                />
              </div>
            </div>

            <div className="form-group">
              <Label htmlFor="issue-email">Contact Email (Optional)</Label>
              <Input
                type="email"
                id="issue-email"
                value={dataIssueForm.contactEmail}
                onChange={e =>
                  setDataIssueForm({
                    ...dataIssueForm,
                    contactEmail: sanitizeEmail(e.target.value),
                  })
                }
                placeholder="your.email@example.com"
              />
            </div>

            <Button
              type="submit"
              variant="default"
              className="submit-button gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="loading-spinner"></div>
                  Reporting...
                </>
              ) : (
                <>
                  <FiAlertTriangle />
                  Report Issue
                </>
              )}
            </Button>
          </form>
        )}
      </div>

      <div className="report-info">
        <div className="info-section">
          <h4>What happens after you submit?</h4>
          <div className="info-steps">
            <div className="info-step">
              <FiCheck className="step-icon" />
              <div>
                <strong>Immediate Acknowledgment</strong>
                <p>Your feedback is received and logged in our system</p>
              </div>
            </div>
            <div className="info-step">
              <FiMessageSquare className="step-icon" />
              <div>
                <strong>Review Process</strong>
                <p>Our team reviews your submission within 2-3 business days</p>
              </div>
            </div>
            <div className="info-step">
              <FiSend className="step-icon" />
              <div>
                <strong>Follow-up</strong>
                <p>If you provided an email, we'll update you on the resolution</p>
              </div>
            </div>
          </div>
        </div>

        <div className="info-section">
          <h4>Tips for effective reporting</h4>
          <ul className="info-tips">
            <li>Be specific about the issue or feedback</li>
            <li>Include relevant details like MP names, constituencies, or project IDs</li>
            <li>For data issues, mention both what you expected and what you found</li>
            <li>Provide your contact email if you want updates on the resolution</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Report
