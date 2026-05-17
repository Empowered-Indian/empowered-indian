import { useEffect, useRef, useState } from 'react'
import { Bug, Lightbulb, Loader2, MessageSquare, Paperclip, Send, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { API_BASE_URL } from '../../utils/constants/api'
import { sanitizeEmail, sanitizeInput } from '../../utils/inputSanitization'
import './StickyFeedbackButton.css'

const MAX_SCREENSHOT_BYTES = 600 * 1024

type FeedbackType = 'bug' | 'feature_request'

type ScreenshotAttachment = {
  fileName: string
  mimeType: string
  size: number
  dataBase64: string
}

const getDefaultPosition = () => {
  if (typeof window === 'undefined') return { x: 24, y: 240 }
  const { width, height } = getTriggerDimensions()

  return {
    x: Math.max(window.innerWidth - width - 16, 16),
    y: Math.max(window.innerHeight - height - 96, 96),
  }
}

const getTriggerDimensions = () => {
  if (typeof window !== 'undefined' && window.innerWidth <= 520) {
    return { width: 52, height: 52 }
  }

  return { width: 132, height: 52 }
}

const clampPosition = (x: number, y: number) => {
  const { width, height } = getTriggerDimensions()
  const margin = 12
  const maxX = Math.max(margin, window.innerWidth - width - margin)
  const maxY = Math.max(margin, window.innerHeight - height - margin)

  return {
    x: Math.min(Math.max(x, margin), maxX),
    y: Math.min(Math.max(y, margin), maxY),
  }
}

const readScreenshot = (file: File): Promise<ScreenshotAttachment> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please attach an image file.'))
      return
    }

    if (file.size > MAX_SCREENSHOT_BYTES) {
      reject(new Error('Screenshot must be 600 KB or smaller.'))
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || '')
      const dataBase64 = result.includes(',') ? result.split(',')[1] : result

      resolve({
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        dataBase64,
      })
    }
    reader.onerror = () => reject(new Error('Could not read screenshot.'))
    reader.readAsDataURL(file)
  })
}

const StickyFeedbackButton = () => {
  const [position, setPosition] = useState(getDefaultPosition)
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('bug')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [summary, setSummary] = useState('')
  const [screenshot, setScreenshot] = useState<ScreenshotAttachment | null>(null)
  const dragState = useRef({
    pointerId: 0,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    moved: false,
  })

  useEffect(() => {
    const onResize = () => {
      setPosition(current => clampPosition(current.x, current.y))
    }

    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen])

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
      moved: false,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragState.current.pointerId !== event.pointerId) return

    const dx = event.clientX - dragState.current.startX
    const dy = event.clientY - dragState.current.startY

    if (Math.abs(dx) + Math.abs(dy) > 6) {
      dragState.current.moved = true
    }

    if (dragState.current.moved) {
      setPosition(clampPosition(dragState.current.originX + dx, dragState.current.originY + dy))
    }
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    if (!dragState.current.moved) {
      setIsOpen(true)
    }
  }

  const handleScreenshotChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setScreenshot(null)
      return
    }

    try {
      setScreenshot(await readScreenshot(file))
    } catch (error) {
      setScreenshot(null)
      event.target.value = ''
      toast.error(error instanceof Error ? error.message : 'Could not attach screenshot.')
    }
  }

  const resetForm = () => {
    setFeedbackType('bug')
    setName('')
    setEmail('')
    setSummary('')
    setScreenshot(null)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const cleanName = sanitizeInput(name, { maxLength: 80, preserveSpaces: false })
    const cleanEmail = sanitizeEmail(email)
    const cleanSummary = sanitizeInput(summary, { maxLength: 900, preserveSpaces: false })

    if (!cleanName || !cleanEmail || !cleanSummary) {
      toast.error('Please add your name, email, and summary.')
      return
    }

    if (cleanSummary.length < 10) {
      toast.error('Summary must be at least 10 characters.')
      return
    }

    const payload = {
      type: feedbackType,
      title: cleanSummary.slice(0, 96),
      description: cleanSummary,
      category: 'general',
      contactEmail: cleanEmail,
      name: cleanName,
      priority: feedbackType === 'bug' ? 'high' : 'medium',
      screenshotAttachment: screenshot,
      userAgent: navigator.userAgent,
      url: window.location.href,
    }

    try {
      setIsSubmitting(true)
      const response = await fetch(`${API_BASE_URL}/feedback/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error || 'Failed to submit feedback')
      }

      toast.success('Feedback submitted. Thank you.')
      resetForm()
      setIsOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit feedback.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        className="sticky-feedback-trigger"
        style={{ left: position.x, top: position.y }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        aria-label="Open feedback form"
      >
        <MessageSquare size={18} aria-hidden="true" />
        <span>Feedback</span>
      </button>

      {isOpen && (
        <div className="sticky-feedback-modal-shell" role="presentation">
          <button
            type="button"
            className="sticky-feedback-backdrop"
            aria-label="Close feedback form"
            onClick={() => setIsOpen(false)}
          />
          <section
            className="sticky-feedback-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sticky-feedback-title"
          >
            <div className="sticky-feedback-header">
              <div>
                <p className="sticky-feedback-kicker">Quick report</p>
                <h2 id="sticky-feedback-title">Send feedback</h2>
              </div>
              <button
                type="button"
                className="sticky-feedback-icon-button"
                onClick={() => setIsOpen(false)}
                aria-label="Close feedback form"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <form className="sticky-feedback-form" onSubmit={handleSubmit}>
              <div className="sticky-feedback-type-grid" role="radiogroup" aria-label="Feedback type">
                <button
                  type="button"
                  className={feedbackType === 'bug' ? 'active' : ''}
                  onClick={() => setFeedbackType('bug')}
                  aria-pressed={feedbackType === 'bug'}
                >
                  <Bug size={18} aria-hidden="true" />
                  Bug report
                </button>
                <button
                  type="button"
                  className={feedbackType === 'feature_request' ? 'active' : ''}
                  onClick={() => setFeedbackType('feature_request')}
                  aria-pressed={feedbackType === 'feature_request'}
                >
                  <Lightbulb size={18} aria-hidden="true" />
                  Feature request
                </button>
              </div>

              <label>
                <span>Name</span>
                <input
                  type="text"
                  value={name}
                  maxLength={80}
                  onChange={event => setName(sanitizeInput(event.target.value, { maxLength: 80 }))}
                  autoComplete="name"
                  required
                />
              </label>

              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  maxLength={254}
                  onChange={event => setEmail(sanitizeEmail(event.target.value))}
                  autoComplete="email"
                  required
                />
              </label>

              <label>
                <span>Summary</span>
                <textarea
                  value={summary}
                  maxLength={900}
                  onChange={event =>
                    setSummary(sanitizeInput(event.target.value, { maxLength: 900 }))
                  }
                  rows={5}
                  required
                />
              </label>

              <label className="sticky-feedback-file">
                <span>
                  <Paperclip size={16} aria-hidden="true" />
                  Screenshot attachment
                </span>
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleScreenshotChange} />
                {screenshot && <em>{screenshot.fileName}</em>}
              </label>

              <button type="submit" className="sticky-feedback-submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="sticky-feedback-spin" size={18} aria-hidden="true" />
                ) : (
                  <Send size={18} aria-hidden="true" />
                )}
                Submit
              </button>
            </form>
          </section>
        </div>
      )}
    </>
  )
}

export default StickyFeedbackButton
