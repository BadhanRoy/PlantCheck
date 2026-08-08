import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { toast } from 'react-hot-toast';
import { Mail, Lock } from 'lucide-react';
import Input from '../components/Input';
import { useAuthStore } from '../store/authStore';

function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const result = await login(email, password);
      if (result.success) {
        if (result.needsVerification) {
          navigate('/verify-email');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      console.log('Google Login Success:', credentialResponse);
      toast.success('Google login successful! 🌱');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Google login failed');
    }
  };

  const handleGoogleError = () => {
    toast.error('Google login failed. Please try again.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden shadow-2xl">
        
        {/* LEFT SIDE - Branding */}
        <div className="bg-gradient-to-br from-[#1a2a20] to-[#0d1a12] p-10 lg:p-14 flex flex-col justify-center items-center lg:items-start text-center lg:text-left border-r border-white/5">
          <div className="mb-6">
            {/* Clickable Logo - Redirects to Homepage */}
            <Link to="/" className="inline-block hover:scale-105 transition-transform duration-300">
              <span className="text-7xl lg:text-8xl block mb-4 animate-float">🌱</span>
            </Link>
            <Link to="/" className="hover:opacity-80 transition-opacity">
              <h1 className="text-4xl lg:text-5xl font-bold text-white">Welcome Back!</h1>
            </Link>
            <p className="text-gray-400 mt-3 text-lg max-w-sm">
              Login to continue managing your plants and tracking their health.
            </p>
          </div>

          <div className="space-y-4 mt-6 w-full max-w-sm">
            <div className="flex items-center gap-3 text-gray-300">
              <span className="text-2xl">🔬</span>
              <span>AI-powered plant diagnosis</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <span className="text-2xl">💬</span>
              <span>Smart chat assistant</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <span className="text-2xl">🌿</span>
              <span>Grower community feed</span>
            </div>
          </div>

          <div className="mt-8 flex gap-8">
            <div>
              <p className="text-2xl font-bold text-[#a3cf8b]">98%</p>
              <p className="text-xs text-gray-500">Accuracy</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#a3cf8b]">50K+</p>
              <p className="text-xs text-gray-500">Plants diagnosed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#a3cf8b]">15min</p>
              <p className="text-xs text-gray-500">Avg response</p>
            </div>
          </div>

          <p className="mt-8 text-sm text-gray-400">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#a3cf8b] hover:text-white font-medium transition-colors">
              Sign up
            </Link>
          </p>
        </div>

        {/* RIGHT SIDE - Login Form */}
        <div className="bg-gradient-to-br from-[#1a2a20]/80 to-[#0d1a12]/80 backdrop-blur-sm p-8 lg:p-12 flex flex-col justify-center">
          <div className="w-full max-w-sm mx-auto">
            <h2 className="text-2xl font-bold text-white mb-1">Login</h2>
            <p className="text-gray-400 text-sm mb-6">Enter your credentials to access your account</p>

            <form onSubmit={handleSubmit}>
              <Input
                icon={Mail}
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className='size-5 text-green-500' />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className='w-full pl-10 pr-3 py-2 bg-gray-800 bg-opacity-50 rounded-lg border border-gray-700 focus:border-green-500 focus:ring-2 focus:ring-green-500 text-white placeholder-gray-400 transition duration-200'
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>

              <div className="text-right mb-6">
                <Link to="/forgot-password" className="text-sm text-[#a3cf8b] hover:text-white transition-colors">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full bg-gradient-to-r from-[#a3cf8b] to-[#7fb46a] text-[#0a0f0d] py-3.5 rounded-lg font-semibold text-base hover:shadow-[0_8px_30px_rgba(163,207,139,0.3)] transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-[#0a0f0d]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging in...
                  </span>
                ) : (
                  'Login'
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#1a2a20] text-gray-400">or continue with</span>
              </div>
            </div>

            <div className="w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="filled_black"
                size="large"
                width="100%"
                text="signin_with"
                shape="rectangular"
                logo_alignment="center"
              />
            </div>

            <div className="mt-6 pt-6 border-t border-white/5">
              <p className="text-center text-xs text-gray-500">
                By continuing, you agree to our{' '}
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;