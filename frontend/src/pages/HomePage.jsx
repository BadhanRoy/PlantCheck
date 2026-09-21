import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

function HomePage() {
  const { isAuthenticated, user } = useAuthStore();
  const canAccessDashboard = isAuthenticated && (user?.isVerified || user?.googleId);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Initialize theme state
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-sans transition-colors duration-200">
      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 md:px-8 h-16 flex items-center transition-colors duration-200">
        <div className="max-w-6xl w-full mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl">🌱</span>
            <span className="font-semibold text-lg text-gray-900 dark:text-white">PlantCheck</span>
          </Link>

          <div className="flex items-center gap-4">
          

            {/* Desktop Nav */}
            <ul className="hidden md:flex items-center gap-6 text-sm">
              <li><a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Features</a></li>
              <li><a href="#how-it-works" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">How it works</a></li>
              {canAccessDashboard ? (
                <li>
                  <Link to="/dashboard" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors">
                    Dashboard
                  </Link>
                </li>
              ) : (
                <>
                  <li><Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Log in</Link></li>
                  <li>
                    <Link to="/signup" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors">
                      Get Started
                    </Link>
                  </li>
                </>
              )}
            </ul>

            {/* Mobile Toggle */}
            <button
              className="md:hidden flex flex-col gap-1.5 p-2"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <span className={`block w-6 h-0.5 bg-gray-900 dark:bg-white transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-6 h-0.5 bg-gray-900 dark:bg-white transition-all ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-6 h-0.5 bg-gray-900 dark:bg-white transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden absolute top-16 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-4 transition-all duration-300 ${menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <a href="#features" onClick={() => setMenuOpen(false)} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Features</a>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">How it works</a>
          {canAccessDashboard ? (
            <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-center transition-colors">
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Log in</Link>
              <Link to="/signup" onClick={() => setMenuOpen(false)} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-center transition-colors">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <header className="pt-24 pb-16 px-4 md:px-8 max-w-6xl mx-auto min-h-[80vh] flex items-center">
        <div className="grid md:grid-cols-2 gap-12 items-center w-full">
          {/* Left Content */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full px-3 py-1 text-sm transition-colors duration-200">
              <span className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full animate-pulse" />
              Is Your Plant Healthy? Find Out!
            </div>

            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              <span className="text-gray-900 dark:text-white">Read the leaf</span>
              <br />
              <span className="text-gray-600 dark:text-gray-400">before it's too late</span>
            </h1>

            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-lg leading-relaxed">
              Upload a picture. Our AI cross-references known lesion patterns,
              discoloration, and blight signatures in seconds.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/signup" className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md font-medium transition-colors">
                Diagnose a plant 
              </Link>
              <a href="#features" className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 px-6 py-3 rounded-md font-medium transition-colors">
                Learn more
              </a>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-4">
              <div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">98%</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Accuracy rate</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">50K+</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Plants diagnosed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">15min</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Average response</p>
              </div>
            </div>
          </div>

          {/* Right - Leaf Illustration */}
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors duration-200">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs text-gray-500 dark:text-gray-400">SAMPLE #04217</span>
              <span className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                <span className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full animate-pulse" />
                SCANNING
              </span>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 transition-colors duration-200">
              <svg viewBox="0 0 400 420" className="w-full h-auto" aria-hidden="true">
                <defs>
                  <linearGradient id="leafGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16a34a" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                <path
                  d="M200 30 C310 50, 370 140, 350 250 C330 360, 240 390, 200 390 C160 390, 70 360, 50 250 C30 140, 90 50, 200 30 Z"
                  fill="url(#leafGrad)"
                  stroke="#16a34a"
                  strokeWidth="1.5"
                  strokeOpacity="0.4"
                />
                <path
                  d="M200 40 L200 385"
                  stroke="#16a34a"
                  strokeWidth="1"
                  strokeOpacity="0.2"
                />
                {[[80, 120, 180, 250, 320], [80, 120, 180, 250, 320]].map((positions, idx) => (
                  <g key={idx}>
                    {positions.map((y, i) => (
                      <path
                        key={i}
                        d={idx === 0 ? `M200 ${y} C165 ${y + 10}, 130 ${y + 20}, 100 ${y + 40}` : `M200 ${y} C235 ${y + 10}, 270 ${y + 20}, 300 ${y + 40}`}
                        stroke="#16a34a"
                        strokeWidth="0.8"
                        strokeOpacity="0.2"
                        fill="none"
                      />
                    ))}
                  </g>
                ))}
                <circle className="fill-red-500 opacity-60" cx="145" cy="180" r="10" />
                <circle className="fill-red-500 opacity-40" cx="260" cy="250" r="7" />
                <circle className="fill-red-500 opacity-30" cx="175" cy="300" r="5" />
              </svg>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center transition-colors duration-200">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Likely cause</div>
                  <div className="font-medium text-sm text-gray-900 dark:text-white">Early Blight</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Confidence</div>
                  <div className="font-medium text-sm text-green-600 dark:text-green-400">91%</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</div>
                  <div className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                    <span className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full animate-pulse" />
                    Active
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ===== FEATURES SECTION ===== */}
      <section id="features" className="py-16 px-4 md:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-green-600 dark:text-green-400 text-sm uppercase tracking-wider mb-2">What we offer</p>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Powerful features for every grower</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: '🔬',
              title: 'Visual Diagnosis',
              desc: 'Upload a photo of any leaf, stem, or fruit. The AI flags lesions, discoloration, and growth patterns.'
            },
            {
              icon: '💬',
              title: 'Chat Assistant',
              desc: 'Get instant answers — treatment timelines, dosages, and whether it\'s contagious to nearby plants.'
            },
            {
              icon: '🌱',
              title: 'Grower\'s Feed',
              desc: 'Post your case, compare it against others, and see what actually worked for similar symptoms.'
            }
          ].map((feature, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all bg-white dark:bg-gray-800">
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="py-16 px-4 md:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-green-600 dark:text-green-400 text-sm uppercase tracking-wider mb-2">Simple Process</p>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">How it works in 3 steps</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Take a Photo', desc: 'Snap a clear photo of the affected leaf, stem, or fruit.' },
            { step: '02', title: 'AI Analysis', desc: 'Our model analyzes the image against thousands of known diseases.' },
            { step: '03', title: 'Get Treatment', desc: 'Receive a detailed diagnosis, treatment plan, and care instructions.' }
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full border-2 border-green-600 dark:border-green-400 flex items-center justify-center text-xl font-bold text-green-600 dark:text-green-400">
                {item.step}
              </div>
              <h3 className="text-lg font-semibold mt-4 text-gray-900 dark:text-white">{item.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-16 px-4 md:px-8 max-w-6xl mx-auto">
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center transition-colors duration-200">
          <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            Your plant is showing symptoms.
            <br />
            <span className="text-green-600 dark:text-green-400">Let's find out why.</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-lg mx-auto">
            Join thousands of growers using AI to protect their plants.
          </p>
          <Link
            to="/signup"
            className="inline-block bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-md font-medium transition-colors"
          >
            Start Diagnosing Free →
          </Link>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-gray-200 dark:border-gray-700 py-12 px-4 md:px-8 max-w-6xl mx-auto transition-colors duration-200">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🌱</span>
              <span className="font-semibold text-lg text-gray-900 dark:text-white">PlantCheck</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
              AI-powered plant diagnosis for growers, farmers, and plant enthusiasts.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Product</h4>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li><a href="#features" className="hover:text-gray-900 dark:hover:text-white">Features</a></li>
              <li><Link to="/signup" className="hover:text-gray-900 dark:hover:text-white">Diagnose</Link></li>
              <li><Link to="/login" className="hover:text-gray-900 dark:hover:text-white">Log in</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Company</h4>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li><a href="#" className="hover:text-gray-900 dark:hover:text-white">About</a></li>
              <li><a href="#" className="hover:text-gray-900 dark:hover:text-white">Careers</a></li>
              <li><a href="#" className="hover:text-gray-900 dark:hover:text-white">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li><a href="#" className="hover:text-gray-900 dark:hover:text-white">Privacy</a></li>
              <li><a href="#" className="hover:text-gray-900 dark:hover:text-white">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 dark:text-gray-400 transition-colors duration-200">
          <span>&copy; {new Date().getFullYear()} PlantCheck. All rights reserved.</span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full animate-pulse" />
            All systems operational
          </span>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;