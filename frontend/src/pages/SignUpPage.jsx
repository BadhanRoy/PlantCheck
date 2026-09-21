import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { toast } from 'react-hot-toast';
import { User, Mail, Lock } from 'lucide-react';
import Input from '../components/Input';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import { useAuthStore } from '../store/authStore';

function SignUpPage() {
  const navigate = useNavigate();
  const { signup, googleSignup, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Theme state
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!agreeTerms) {
      toast.error('Please agree to the Terms of Service');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await signup(name, email, password);
      if (result.success) {
        navigate('/verify-email');
        toast.success('Please check your email for verification code! 📧');
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Signup failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const result = await googleSignup(credentialResponse.credential);
    if (result.success) {
      toast.success('Google signup successful! 🌱');
      navigate('/dashboard');
    }
  };

  const handleGoogleError = () => {
    toast.error('Google signup failed. Please try again.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-gray-900 transition-colors duration-200">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-lg overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
        
        {/* LEFT SIDE - Branding */}
        <div className="bg-gray-50 dark:bg-gray-800 p-10 lg:p-14 flex flex-col justify-center items-center lg:items-start text-center lg:text-left transition-colors duration-200">
          <div className="mb-6">
            <Link to="/" className="inline-block">
              <span className="text-6xl lg:text-7xl block mb-4">🌱</span>
            </Link>
            <Link to="/">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">Join PlantCheck</h1>
            </Link>
            <p className="text-gray-600 dark:text-gray-400 mt-3 text-lg max-w-sm">
              Start diagnosing your plants with AI-powered technology.
            </p>
          </div>

          <div className="space-y-4 mt-6 w-full max-w-sm">
            <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
              <span className="text-2xl">🔬</span>
              <span>AI-powered plant diagnosis</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
              <span className="text-2xl">💬</span>
              <span>Smart chat assistant</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
              <span className="text-2xl">🌿</span>
              <span>Grower community feed</span>
            </div>
          </div>

          {/* <div className="mt-8 flex gap-8">
            <div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">98%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Accuracy</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">50K+</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Plants diagnosed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">Free</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">To get started</p>
            </div>
          </div> */}

          <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium transition-colors">
              Login
            </Link>
          </p>
        </div>

        {/* RIGHT SIDE - Signup Form */}
        <div className="bg-white dark:bg-gray-900 p-8 lg:p-12 flex flex-col justify-center transition-colors duration-200">
          <div className="w-full max-w-sm mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Create Account</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">Fill in your details to get started</p>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <Input
                  icon={User}
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <Input
                  icon={Mail}
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="relative mb-2">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className='size-5 text-green-600 dark:text-green-400' />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className='w-full pl-10 pr-10 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:border-green-500 focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition duration-200 outline-none'
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>

              {password && <PasswordStrengthMeter password={password} />}

              <div className="mt-4 mb-6">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 accent-green-600 cursor-pointer"
                    required
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    I agree to the{' '}
                    <a href="#" className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors">Terms</a>
                    {' '}and{' '}
                    <a href="#" className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors">Privacy Policy</a>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={!agreeTerms || isSubmitting || isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-md font-medium text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">or continue with</span>
              </div>
            </div>

            <div className="w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme={darkMode ? "filled_black" : "outline"}
                size="large"
                width="100%"
                text="signup_with"
                shape="rectangular"
                logo_alignment="center"
              />
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                🌿 Join thousands of growers using AI to protect their plants
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;