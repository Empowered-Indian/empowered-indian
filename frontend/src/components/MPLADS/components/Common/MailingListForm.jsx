import { useState } from 'react';
import { sanitizeEmail } from '../../../../utils/inputSanitization';
import { FiMail, FiCheckCircle, FiInfo, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { subscribeToMailingList } from '../../../../services/api/mailingList';
import './MailingListForm.css';

const MailingListForm = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);
  const [inlineError, setInlineError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email');

    try {
      setLoading(true);
      setAlreadySubscribed(false);
      setInlineError('');
      const res = await subscribeToMailingList(email, { skipErrorToast: true });
      toast.success(res?.message || 'Verification email sent');
      setSubmitted(true);
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message || err?.response?.data?.error;
      if (status === 409) {
        setAlreadySubscribed(true);
      } else if (message) {
        setInlineError(message);
      } else {
        setInlineError('Something went wrong. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="mailing-success">
        <FiCheckCircle className="icon" />
        <h4>Check your inbox</h4>
        <p>We sent a verification link to confirm your subscription.</p>
      </div>
    );
  }

  return (
    <form className="mailing-form" onSubmit={handleSubmit}>
      <div className="mailing-input-group">
        <FiMail className="mail-icon" />
        <input
          style={{ width: '100%' }}
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(sanitizeEmail(e.target.value))}
          disabled={loading}
          required
        />
      </div>
      <button type="submit" className="mailing-submit" disabled={loading}>
        {loading ? 'Submitting…' : 'Subscribe'}
      </button>
      {alreadySubscribed && (
        <div className="mailing-inline info">
          <FiInfo className="icon" />
          <span>This email is already subscribed and verified.</span>
        </div>
      )}
      {inlineError && !alreadySubscribed && (
        <div className="mailing-inline error">
          <FiAlertCircle className="icon" />
          <span>{inlineError}</span>
        </div>
      )}
      <p className="mailing-hint">No spam. Unsubscribe anytime.</p>
    </form>
  );
};

export default MailingListForm;


