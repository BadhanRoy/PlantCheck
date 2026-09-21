import { Link } from 'react-router-dom';
import { useState } from 'react';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Reset password for:', email);
    setSubmitted(true);
    // Handle forgot password logic here
  };

  return (
    <div className="min-h-screen bg-[#0a0f0d] flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-[#1a2a20] to-[#0d1a12] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <div className="text-5xl mb-3">🔑</div>
          </Link>
          <h1 className="text-2xl font-bold text-white">Forgot Password</h1>
          <p className="text-gray-400 text-sm mt-1">
            Enter your email to reset your password
          </p>
        </div>

        {submitted ? (
          <div className="text-center">
            <div className="text-4xl mb-4">📧</div>
            <p className="text-[#a3cf8b] font-medium">Email Sent!</p>
            <p className="text-gray-400 text-sm mt-2">
              Check your email for password reset instructions.
            </p>
            <Link
              to="/login"
              className="inline-block mt-6 text-[#a3cf8b] hover:text-white transition-colors"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm text-gray-300 mb-2 font-medium">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a0f0d] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#a3cf8b] transition-colors"
                placeholder="you@example.com"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#a3cf8b] to-[#7fb46a] text-[#0a0f0d] py-3.5 rounded-lg font-semibold text-base hover:shadow-[0_8px_30px_rgba(163,207,139,0.3)] transition-all hover:-translate-y-0.5"
            >
              Send Reset Link
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;