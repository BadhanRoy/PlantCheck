import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

function EmailVerificationPage() {
  const navigate = useNavigate();
  const { user, verifyEmail, resendVerificationCode, isLoading } = useAuthStore();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (user?.isVerified) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleChange = (index, value) => {
    if (value.length > 1) return;
    
    if (value.length === 6) {
      const digits = value.split('');
      setCode(digits);
      setTimeout(() => {
        handleVerify(digits.join(''));
      }, 100);
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();
    if (pastedData.length === 6 && /^\d+$/.test(pastedData)) {
      const digits = pastedData.split('');
      setCode(digits);
      setTimeout(() => {
        handleVerify(pastedData);
      }, 100);
    } else {
      toast.error('Please paste a valid 6-digit code');
    }
  };

  const handleVerify = async (verificationCode) => {
    const finalCode = verificationCode || code.join('');
    if (finalCode.length !== 6) {
      toast.error('Please enter all 6 digits');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await verifyEmail(finalCode);
      if (result.success) {
        toast.success('Email verified successfully! 🎉');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.message || 'Verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleVerify();
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await resendVerificationCode();
      toast.success('Verification code resent! 📧');
    } catch (error) {
      toast.error(error.message || 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f0d] flex items-center justify-center p-4 relative z-10">
      <div className="w-full max-w-md">
        <div className="bg-gradient-to-br from-[#1a2a20] to-[#0d1a12] border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            {/* Clickable Logo - Redirects to Homepage */}
            <Link to="/" className="inline-block hover:scale-105 transition-transform duration-300">
              <div className="text-5xl mb-3">🌱</div>
            </Link>
            <h1 className="text-2xl font-bold text-white">Verify Your Email</h1>
            <p className="text-gray-400 text-sm mt-1">
              Enter the 6-digit code sent to{' '}
              <span className="text-[#a3cf8b]">{user?.email || 'your email'}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center bg-[#0a0f0d] border border-white/10 rounded-lg text-white text-2xl font-bold focus:outline-none focus:border-[#a3cf8b] focus:ring-2 focus:ring-[#a3cf8b] transition-all"
                  placeholder="0"
                  autoFocus={index === 0}
                  disabled={isSubmitting}
                />
              ))}
            </div>

            <div className="text-center text-sm text-gray-400 mb-6">
              <p>💡 You can paste the entire 6-digit code at once</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-[#a3cf8b] to-[#7fb46a] text-[#0a0f0d] py-3.5 rounded-lg font-semibold text-base hover:shadow-[0_8px_30px_rgba(163,207,139,0.3)] transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-[#0a0f0d]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </span>
              ) : (
                'Verify Email'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Didn't receive the code?{' '}
              <button
                onClick={handleResend}
                disabled={isResending}
                className="text-[#a3cf8b] hover:text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? 'Sending...' : 'Resend'}
              </button>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-white/5">
            <p className="text-center text-xs text-gray-500">
              Check your spam folder if you don't see the email
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailVerificationPage;