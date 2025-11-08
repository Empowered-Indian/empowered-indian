import { useState, useEffect, useCallback } from 'react'
import {
  FiMessageSquare,
  FiAlertTriangle,
  FiCheck,
  FiClock,
  FiX,
  FiPlay,
  FiRefreshCw,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiTrash2,
  FiLogOut,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import { API_BASE_URL } from '../../../utils/constants/api'
import './Admin.css'
import { getSubscribers } from '../../../services/api/mailingList'
import { Button } from '@/components/ui/button'

const Admin = () => {
  const navigate = useNavigate()
  const { user, logout, getAuthHeaders } = useAuth()
  const [activeTab, setActiveTab] = useState('feedback')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState([])
  const [dataIssues, setDataIssues] = useState([])
  const [feedbackPagination, setFeedbackPagination] = useState({})
  const [issuesPagination, setIssuesPagination] = useState({})
  const [subscribers, setSubscribers] = useState([])
  const [subsPagination, setSubsPagination] = useState({})
  const [subsStats, setSubsStats] = useState(null)

  // Filter states
  const [feedbackFilters, setFeedbackFilters] = useState({
    status: '',
    type: '',
    priority: '',
    page: 1,
  })

  const [issuesFilters, setIssuesFilters] = useState({
    status: '',
    issueType: '',
    page: 1,
  })

  const [subsFilters, setSubsFilters] = useState({
    verified: '',
    active: '',
    page: 1,
  })

  // Handle logout
  const handleLogout = () => {
    logout()
    navigate('/mplads/login')
    toast.success('Logged out successfully')
  }

  // Fetch feedback data
  const fetchFeedback = useCallback(
    async (filters = feedbackFilters) => {
      try {
        setLoading(true)
        const params = new URLSearchParams()

        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value)
        })

        const response = await fetch(`${API_BASE_URL}/feedback/all?${params.toString()}`, {
          headers: getAuthHeaders(),
        })
        const result = await response.json()

        if (result.success) {
          setFeedback(result.data)
          setFeedbackPagination(result.pagination)
        } else {
          toast.error('Failed to fetch feedback')
        }
      } catch (error) {
        console.error('Error fetching feedback:', error)
        toast.error('Failed to fetch feedback')
      } finally {
        setLoading(false)
      }
    },
    [feedbackFilters, getAuthHeaders]
  )

  // Fetch data issues
  const fetchDataIssues = useCallback(
    async (filters = issuesFilters) => {
      try {
        setLoading(true)
        const params = new URLSearchParams()

        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value)
        })

        const response = await fetch(`${API_BASE_URL}/feedback/data-issues?${params.toString()}`, {
          headers: getAuthHeaders(),
        })
        const result = await response.json()

        if (result.success) {
          setDataIssues(result.data)
          setIssuesPagination(result.pagination)
        } else {
          toast.error('Failed to fetch data issues')
        }
      } catch (error) {
        console.error('Error fetching data issues:', error)
        toast.error('Failed to fetch data issues')
      } finally {
        setLoading(false)
      }
    },
    [issuesFilters, getAuthHeaders]
  )

  // Update feedback status
  const updateFeedbackStatus = async (id, status) => {
    try {
      const response = await fetch(`${API_BASE_URL}/feedback/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ status }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Status updated successfully')
        fetchFeedback()
      } else {
        toast.error(result.message || 'Failed to update status')
      }
    } catch (error) {
      console.error('Error updating feedback status:', error)
      toast.error('Failed to update status')
    }
  }

  // Update data issue status
  const updateDataIssueStatus = async (id, status) => {
    try {
      const response = await fetch(`${API_BASE_URL}/feedback/data-issue/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ status }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Status updated successfully')
        fetchDataIssues()
      } else {
        toast.error(result.message || 'Failed to update status')
      }
    } catch (error) {
      console.error('Error updating data issue status:', error)
      toast.error('Failed to update status')
    }
  }

  const fetchSubscribers = useCallback(
    async (filters = subsFilters) => {
      try {
        setLoading(true)
        const params = {
          page: filters.page,
          verified: filters.verified === '' ? undefined : filters.verified === 'true',
          active: filters.active === '' ? undefined : filters.active === 'true',
        }
        const res = await getSubscribers(params)
        setSubscribers(res?.subscribers || [])
        const p = res?.pagination || {}
        setSubsPagination({
          currentPage: p.page,
          totalPages: p.pages,
          totalItems: p.total,
          hasPrevPage: (p.page || 1) > 1,
          hasNextPage: (p.page || 1) < (p.pages || 1),
        })
        setSubsStats(res?.stats || null)
      } catch {
        // toast handled globally
      } finally {
        setLoading(false)
      }
    },
    [subsFilters]
  )

  // Delete feedback
  const deleteFeedback = async id => {
    if (
      !window.confirm(
        'Are you sure you want to delete this feedback? This action cannot be undone.'
      )
    ) {
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/feedback/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Feedback deleted successfully')
        fetchFeedback()
      } else {
        toast.error(result.message || 'Failed to delete feedback')
      }
    } catch (error) {
      console.error('Error deleting feedback:', error)
      toast.error('Failed to delete feedback')
    }
  }

  // Delete data issue
  const deleteDataIssue = async id => {
    if (
      !window.confirm(
        'Are you sure you want to delete this data issue? This action cannot be undone.'
      )
    ) {
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/feedback/data-issue/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Data issue deleted successfully')
        fetchDataIssues()
      } else {
        toast.error(result.message || 'Failed to delete data issue')
      }
    } catch (error) {
      console.error('Error deleting data issue:', error)
      toast.error('Failed to delete data issue')
    }
  }

  // Handle filter changes
  const handleFeedbackFilterChange = (key, value) => {
    const newFilters = { ...feedbackFilters, [key]: value, page: 1 }
    setFeedbackFilters(newFilters)
    fetchFeedback(newFilters)
  }

  const handleIssuesFilterChange = (key, value) => {
    const newFilters = { ...issuesFilters, [key]: value, page: 1 }
    setIssuesFilters(newFilters)
    fetchDataIssues(newFilters)
  }

  // Handle pagination
  const handleFeedbackPageChange = page => {
    const newFilters = { ...feedbackFilters, page }
    setFeedbackFilters(newFilters)
    fetchFeedback(newFilters)
  }

  const handleIssuesPageChange = page => {
    const newFilters = { ...issuesFilters, page }
    setIssuesFilters(newFilters)
    fetchDataIssues(newFilters)
  }

  const handleSubsFilterChange = (key, value) => {
    const newFilters = { ...subsFilters, [key]: value, page: 1 }
    setSubsFilters(newFilters)
    fetchSubscribers(newFilters)
  }

  const handleSubsPageChange = page => {
    const newFilters = { ...subsFilters, page }
    setSubsFilters(newFilters)
    fetchSubscribers(newFilters)
  }

  // Load data on component mount and tab change
  useEffect(() => {
    if (activeTab === 'feedback') {
      fetchFeedback()
    } else if (activeTab === 'data-issues') {
      fetchDataIssues()
    } else if (activeTab === 'subscribers') {
      fetchSubscribers()
    }
  }, [activeTab, fetchFeedback, fetchDataIssues, fetchSubscribers])

  // Status badge component
  const StatusBadge = ({ status, type = 'feedback' }) => {
    const getStatusConfig = () => {
      if (type === 'feedback') {
        switch (status) {
          case 'open':
            return { icon: <FiClock />, className: 'status-open', label: 'Open' }
          case 'in_progress':
            return { icon: <FiPlay />, className: 'status-progress', label: 'In Progress' }
          case 'resolved':
            return { icon: <FiCheck />, className: 'status-resolved', label: 'Resolved' }
          case 'closed':
            return { icon: <FiX />, className: 'status-closed', label: 'Closed' }
          default:
            return { icon: <FiClock />, className: 'status-open', label: status }
        }
      } else {
        switch (status) {
          case 'reported':
            return { icon: <FiAlertTriangle />, className: 'status-reported', label: 'Reported' }
          case 'investigating':
            return { icon: <FiPlay />, className: 'status-investigating', label: 'Investigating' }
          case 'fixed':
            return { icon: <FiCheck />, className: 'status-fixed', label: 'Fixed' }
          case 'invalid':
            return { icon: <FiX />, className: 'status-invalid', label: 'Invalid' }
          default:
            return { icon: <FiAlertTriangle />, className: 'status-reported', label: status }
        }
      }
    }

    const config = getStatusConfig()
    return (
      <span className={`status-badge ${config.className}`}>
        {config.icon}
        {config.label}
      </span>
    )
  }

  // Pagination component
  const Pagination = ({ pagination, onPageChange }) => {
    if (!pagination || pagination.totalPages <= 1) return null

    return (
      <div className="pagination">
        <Button
          onClick={() => onPageChange(pagination.currentPage - 1)}
          disabled={!pagination.hasPrevPage}
          className="pagination-button gap-2"
          variant="outline"
        >
          <FiChevronLeft />
          Previous
        </Button>

        <span className="pagination-info">
          Page {pagination.currentPage} of {pagination.totalPages}({pagination.totalItems} total)
        </span>

        <Button
          onClick={() => onPageChange(pagination.currentPage + 1)}
          disabled={!pagination.hasNextPage}
          className="pagination-button gap-2"
          variant="outline"
        >
          Next
          <FiChevronRight />
        </Button>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-header-content">
          <div className="admin-title">
            <h1>Admin Dashboard</h1>
            <p>Manage feedback submissions and data issue reports</p>
          </div>
          <div className="admin-user-info">
            <div className="user-details">
              <span className="user-name">{user?.name || user?.email}</span>
              <span className="user-role">{user?.role}</span>
            </div>
            <Button onClick={handleLogout} className="logout-button gap-2" variant="ghost">
              <FiLogOut />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="admin-tabs">
        <Button
          className={`tab-button gap-2 ${activeTab === 'feedback' ? 'active' : ''}`}
          onClick={() => setActiveTab('feedback')}
          variant="ghost"
        >
          <FiMessageSquare />
          Feedback ({feedbackPagination.totalItems || 0})
        </Button>
        <Button
          className={`tab-button gap-2 ${activeTab === 'data-issues' ? 'active' : ''}`}
          onClick={() => setActiveTab('data-issues')}
          variant="ghost"
        >
          <FiAlertTriangle />
          Data Issues ({issuesPagination.totalItems || 0})
        </Button>
        <Button
          className={`tab-button gap-2 ${activeTab === 'subscribers' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscribers')}
          variant="ghost"
        >
          Subscribers ({subsPagination.totalItems || 0})
        </Button>
      </div>

      <div className="admin-content">
        {activeTab === 'feedback' && (
          <div className="feedback-section">
            <div className="section-header">
              <h3>Feedback Submissions</h3>
              <Button
                onClick={() => fetchFeedback()}
                className="refresh-button gap-2"
                disabled={loading}
                variant="outline"
              >
                <FiRefreshCw className={loading ? 'spinning' : ''} />
                Refresh
              </Button>
            </div>

            {/* Feedback Filters */}
            <div className="filters">
              <div className="filter-group">
                <label htmlFor="feedback-status-filter">Status:</label>
                <select
                  id="feedback-status-filter"
                  value={feedbackFilters.status}
                  onChange={e => handleFeedbackFilterChange('status', e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="feedback-type-filter">Type:</label>
                <select
                  id="feedback-type-filter"
                  value={feedbackFilters.type}
                  onChange={e => handleFeedbackFilterChange('type', e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="general">General</option>
                  <option value="bug">Bug</option>
                  <option value="feature_request">Feature Request</option>
                  <option value="data_issue">Data Issue</option>
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="feedback-priority-filter">Priority:</label>
                <select
                  id="feedback-priority-filter"
                  value={feedbackFilters.priority}
                  onChange={e => handleFeedbackFilterChange('priority', e.target.value)}
                >
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {/* Feedback List */}
            <div className="submissions-list">
              {loading && <div className="loading">Loading...</div>}
              {!loading && feedback.length === 0 && (
                <div className="no-data">No feedback submissions found</div>
              )}
              {!loading && feedback.length > 0 && (
                <>
                  {feedback.map(item => (
                    <div key={item._id} className="submission-card">
                      <div className="submission-header">
                        <div className="submission-title">
                          <h4>{item.title}</h4>
                          <div className="submission-meta">
                            <span className="submission-type">{item.type.replace('_', ' ')}</span>
                            <span className="submission-category">{item.category}</span>
                            <span className="submission-priority priority-{item.priority}">
                              {item.priority}
                            </span>
                          </div>
                        </div>
                        <div className="submission-status">
                          <StatusBadge status={item.status} type="feedback" />
                        </div>
                      </div>

                      <div className="submission-body">
                        <p className="submission-description">{item.description}</p>
                        <div className="submission-details">
                          <span>Submitted: {new Date(item.createdAt).toLocaleDateString()}</span>
                          {item.contactEmail && <span>Contact: {item.contactEmail}</span>}
                        </div>
                      </div>

                      <div className="submission-actions">
                        <Button
                          onClick={() => updateFeedbackStatus(item._id, 'in_progress')}
                          disabled={item.status === 'in_progress'}
                          className="action-button progress"
                          variant="default"
                        >
                          Mark In Progress
                        </Button>
                        <Button
                          onClick={() => updateFeedbackStatus(item._id, 'resolved')}
                          disabled={item.status === 'resolved'}
                          className="action-button resolved"
                          variant="default"
                        >
                          Mark Resolved
                        </Button>
                        <Button
                          onClick={() => updateFeedbackStatus(item._id, 'closed')}
                          disabled={item.status === 'closed'}
                          className="action-button closed"
                          variant="outline"
                        >
                          Close
                        </Button>
                        <Button
                          onClick={() => deleteFeedback(item._id)}
                          className="action-button delete gap-2"
                          title="Delete feedback"
                          variant="destructive"
                        >
                          <FiTrash2 />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Pagination
                    pagination={feedbackPagination}
                    onPageChange={handleFeedbackPageChange}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'data-issues' && (
          <div className="data-issues-section">
            <div className="section-header">
              <h3>Data Issue Reports</h3>
              <Button
                onClick={() => fetchDataIssues()}
                className="refresh-button gap-2"
                disabled={loading}
                variant="outline"
              >
                <FiRefreshCw className={loading ? 'spinning' : ''} />
                Refresh
              </Button>
            </div>

            {/* Data Issues Filters */}
            <div className="filters">
              <div className="filter-group">
                <label htmlFor="issues-status-filter">Status:</label>
                <select
                  id="issues-status-filter"
                  value={issuesFilters.status}
                  onChange={e => handleIssuesFilterChange('status', e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="reported">Reported</option>
                  <option value="investigating">Investigating</option>
                  <option value="fixed">Fixed</option>
                  <option value="invalid">Invalid</option>
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="issues-type-filter">Issue Type:</label>
                <select
                  id="issues-type-filter"
                  value={issuesFilters.issueType}
                  onChange={e => handleIssuesFilterChange('issueType', e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="incorrect_data">Incorrect Data</option>
                  <option value="missing_data">Missing Data</option>
                  <option value="outdated_data">Outdated Data</option>
                </select>
              </div>
            </div>

            {/* Data Issues List */}
            <div className="submissions-list">
              {loading && <div className="loading">Loading...</div>}
              {!loading && dataIssues.length === 0 && (
                <div className="no-data">No data issues found</div>
              )}
              {!loading && dataIssues.length > 0 && (
                <>
                  {dataIssues.map(item => (
                    <div key={item._id} className="submission-card">
                      <div className="submission-header">
                        <div className="submission-title">
                          <h4>
                            {item.issueType.replace('_', ' ')} - {item.mpName || 'General'}
                          </h4>
                          <div className="submission-meta">
                            <span className="submission-location">
                              {item.location || 'No location'}
                            </span>
                            {item.workId && (
                              <span className="submission-work-id">Work ID: {item.workId}</span>
                            )}
                          </div>
                        </div>
                        <div className="submission-status">
                          <StatusBadge status={item.status} type="issue" />
                        </div>
                      </div>

                      <div className="submission-body">
                        <p className="submission-description">{item.description}</p>
                        <div className="submission-details">
                          <span>Reported: {new Date(item.createdAt).toLocaleDateString()}</span>
                          {item.contactEmail && <span>Contact: {item.contactEmail}</span>}
                          {item.expectedValue && <span>Expected: {item.expectedValue}</span>}
                          {item.actualValue && <span>Actual: {item.actualValue}</span>}
                        </div>
                      </div>

                      <div className="submission-actions">
                        <Button
                          onClick={() => updateDataIssueStatus(item._id, 'investigating')}
                          disabled={item.status === 'investigating'}
                          className="action-button investigating"
                          variant="default"
                        >
                          Mark Investigating
                        </Button>
                        <Button
                          onClick={() => updateDataIssueStatus(item._id, 'fixed')}
                          disabled={item.status === 'fixed'}
                          className="action-button fixed"
                          variant="default"
                        >
                          Mark Fixed
                        </Button>
                        <Button
                          onClick={() => updateDataIssueStatus(item._id, 'invalid')}
                          disabled={item.status === 'invalid'}
                          className="action-button invalid"
                          variant="outline"
                        >
                          Mark Invalid
                        </Button>
                        <Button
                          onClick={() => deleteDataIssue(item._id)}
                          className="action-button delete gap-2"
                          title="Delete data issue"
                          variant="destructive"
                        >
                          <FiTrash2 />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Pagination pagination={issuesPagination} onPageChange={handleIssuesPageChange} />
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'subscribers' && (
          <div className="subscribers-section">
            <div className="section-header">
              <h3>Mailing List Subscribers</h3>
              <Button
                onClick={() => fetchSubscribers()}
                className="refresh-button gap-2"
                disabled={loading}
                variant="outline"
              >
                <FiRefreshCw className={loading ? 'spinning' : ''} />
                Refresh
              </Button>
            </div>

            <div className="filters">
              <div className="filter-group">
                <label htmlFor="subs-verified-filter">Verified:</label>
                <select
                  id="subs-verified-filter"
                  value={subsFilters.verified}
                  onChange={e => handleSubsFilterChange('verified', e.target.value)}
                >
                  <option value="">All</option>
                  <option value="true">Verified</option>
                  <option value="false">Unverified</option>
                </select>
              </div>
              <div className="filter-group">
                <label htmlFor="subs-active-filter">Active:</label>
                <select
                  id="subs-active-filter"
                  value={subsFilters.active}
                  onChange={e => handleSubsFilterChange('active', e.target.value)}
                >
                  <option value="">All</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            {subsStats && (
              <div className="subs-stats">
                <div>Total: {subsStats.total}</div>
                <div>Verified: {subsStats.verified}</div>
                <div>Unverified: {subsStats.unverified}</div>
                <div>Active: {subsStats.active}</div>
                <div>Pending: {subsStats.pending_verification}</div>
                <div>Unsubscribed: {subsStats.unsubscribed}</div>
              </div>
            )}

            <div className="submissions-list">
              {loading && <div className="loading">Loading...</div>}
              {!loading && subscribers.length === 0 && (
                <div className="no-data">No subscribers found</div>
              )}
              {!loading && subscribers.length > 0 && (
                <>
                  {subscribers.map(s => (
                    <div key={s._id || s.email} className="submission-card">
                      <div className="submission-header">
                        <div className="submission-title">
                          <h4>{s.email}</h4>
                          <div className="submission-meta">
                            <span className="submission-type">
                              Subscribed:{' '}
                              {s.subscribedAt ? new Date(s.subscribedAt).toLocaleDateString() : '-'}
                            </span>
                            {s.verifiedAt && (
                              <span className="submission-category">
                                Verified: {new Date(s.verifiedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="submission-status">
                          <span
                            className={`status-badge ${s.isVerified ? 'status-resolved' : 'status-open'}`}
                          >
                            {s.isVerified ? <FiCheck /> : <FiClock />}
                            {s.isVerified ? 'Verified' : 'Pending'}
                          </span>
                          <span
                            className={`status-badge ${s.isActive ? 'status-progress' : 'status-closed'}`}
                          >
                            {s.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="submission-body">
                        <div className="submission-details">
                          {s.ipAddress && <span>IP: {s.ipAddress}</span>}
                          {s.source && <span>Source: {s.source}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                  <Pagination pagination={subsPagination} onPageChange={handleSubsPageChange} />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Admin
