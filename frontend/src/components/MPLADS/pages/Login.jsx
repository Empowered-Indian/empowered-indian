import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiUser, FiLock, FiEye, FiEyeOff, FiLogIn, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Get the page user was trying to access
  const from = location.state?.from?.pathname || '/mplads/admin';

  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!email) {
      return 'Email is required';
    }
    
    if (email.length > 254) {
      return 'Email is too long';
    }
    
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    
    // Check for common security issues
    if (email.includes('<') || email.includes('>') || email.includes('"') || email.includes('\'')) {
      return 'Email contains invalid characters';
    }
    
    return null;
  };

  // Password validation function
  const validatePassword = (password) => {
    if (!password) {
      return 'Password is required';
    }
    
    if (password.length < 3) {
      return 'Password is too short';
    }
    
    if (password.length > 128) {
      return 'Password is too long';
    }
    
    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: null
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form fields
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    
    const errors = {
      email: emailError,
      password: passwordError
    };
    
    setValidationErrors(errors);
    
    // If there are validation errors, don't submit
    if (emailError || passwordError) {
      if (emailError) {
        toast.error(emailError);
      } else if (passwordError) {
        toast.error(passwordError);
      }
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await login(formData.email.trim(), formData.password);
      
      if (result.success) {
        toast.success('Login successful!');
        navigate(from, { replace: true });
      } else {
        toast.error(result.message || 'Login failed');
      }
    } catch {
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Admin Login</h1>
          <p>Sign in to access the admin dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <Label htmlFor="email" className="flex items-center gap-2">
              <FiUser />
              Email Address
            </Label>
            <Input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              autoComplete="email"
              className={validationErrors.email ? 'border-red-500' : ''}
              aria-invalid={!!validationErrors.email}
              aria-describedby={validationErrors.email ? 'email-error' : undefined}
            />
            {validationErrors.email && (
              <span id="email-error" className="error-message">
                <FiAlertCircle />
                {validationErrors.email}
              </span>
            )}
          </div>

          <div className="form-group">
            <Label htmlFor="password" className="flex items-center gap-2">
              <FiLock />
              Password
            </Label>
            <div className="password-input">
              <Input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className={validationErrors.password ? 'border-red-500' : ''}
                aria-invalid={!!validationErrors.password}
                aria-describedby={validationErrors.password ? 'password-error' : undefined}
              />
              <Button
                type="button"
                variant="ghost"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </Button>
            </div>
            {validationErrors.password && (
              <span id="password-error" className="error-message">
                <FiAlertCircle />
                {validationErrors.password}
              </span>
            )}
          </div>

          <Button
            type="submit"
            variant="default"
            className="login-button gap-2 bg-blue-600 text-white hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="loading-spinner"></div>
                Signing in...
              </>
            ) : (
              <>
                <FiLogIn />
                Sign In
              </>
            )}
          </Button>
        </form>

        <div className="login-footer">
          <div className="security-note">
            <p>🔒 Secure admin access only</p>
            <p>This area is restricted to authorized administrators</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;