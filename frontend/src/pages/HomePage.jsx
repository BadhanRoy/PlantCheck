import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-10');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative w-full overflow-x-hidden bg-[#0a0f0d] text-white font-sans">

      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(163,207,139,0.08),transparent_70%)]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(255,106,69,0.06),transparent_70%)]" />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,rgba(163,207,139,0.03),transparent_70%)]" />
      </div>

      {/* Grain Texture */}
      <div className="fixed inset-0 pointer-events-none z-[1] opacity-[0.03] bg-[url('data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'120\' height=\'120\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'2\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E')]" />

      {/* ===== NAVBAR ===== */}
      <nav className={`fixed top-0 left-0 right-0 z-[100] px-6 md:px-12 h-[70px] flex items-center transition-all duration-300 ${scrolled ? 'bg-[#0a0f0d]/95 backdrop-blur-xl border-b border-white/5 shadow-2xl' : 'bg-transparent'
        }`}>
        <div className="max-w-7xl w-full mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🌱</span>
            <span className="font-mono text-sm tracking-widest font-bold bg-gradient-to-r from-[#a3cf8b] to-[#ff6a45] bg-clip-text text-transparent">
              PlantCheck
            </span>
          </Link>

          {/* Desktop Nav */}
          <ul className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <li><a href="#features" className="hover:text-white transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-[#a3cf8b] after:transition-all hover:after:w-full">Features</a></li>
            <li><a href="#how-it-works" className="hover:text-white transition-colors">How it works</a></li>
            <li><Link to="/login" className="hover:text-white transition-colors">Log in</Link></li>
            <li>
              <Link to="/signup" className="bg-gradient-to-r from-[#a3cf8b] to-[#7fb46a] text-[#0a0f0d] px-5 py-2.5 rounded-lg font-semibold text-sm hover:shadow-[0_8px_30px_rgba(163,207,139,0.3)] transition-all hover:-translate-y-0.5">
                Get Started
              </Link>
            </li>
          </ul>

          {/* Mobile Toggle */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className={`block w-6 h-0.5 bg-white transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-6 h-0.5 bg-white transition-all ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-6 h-0.5 bg-white transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden absolute top-[70px] left-0 right-0 bg-[#0a0f0d]/98 backdrop-blur-xl border-b border-white/5 p-6 flex flex-col gap-5 transition-all duration-300 ${menuOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'
          }`}>
          <a href="#features" onClick={() => setMenuOpen(false)} className="text-gray-400 hover:text-white text-lg">Features</a>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="text-gray-400 hover:text-white text-lg">How it works</a>
          <Link to="/login" onClick={() => setMenuOpen(false)} className="text-gray-400 hover:text-white text-lg">Log in</Link>
          <Link to="/signup" onClick={() => setMenuOpen(false)} className="bg-gradient-to-r from-[#a3cf8b] to-[#7fb46a] text-[#0a0f0d] px-5 py-3 rounded-lg font-semibold text-center">
            Get Started
          </Link>
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <header className="relative z-10 pt-[120px] pb-20 px-6 md:px-12 max-w-7xl mx-auto min-h-screen flex items-center">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center w-full">

          {/* Left Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 text-sm text-[#a3cf8b] font-mono">
              <span className="w-2 h-2 bg-[#a3cf8b] rounded-full animate-pulse" />
              AI-Powered Plant Diagnosis
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1]">
              <span className="bg-gradient-to-r from-white via-[#a3cf8b] to-[#ff8a63] bg-clip-text text-transparent">
                Read the leaf
              </span>
              <br />
              <span className="text-white/90">before it's too late</span>
            </h1>

            <p className="text-lg text-gray-400 max-w-lg leading-relaxed">
              Photograph a symptom. Our AI cross-references known lesion patterns,
              discoloration, and blight signatures in seconds — then an assistant
              walks you through treatment.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/signup" className="group bg-gradient-to-r from-[#a3cf8b] to-[#7fb46a] text-[#0a0f0d] px-8 py-4 rounded-xl font-semibold hover:shadow-[0_8px_30px_rgba(163,207,139,0.3)] transition-all hover:-translate-y-1 flex items-center gap-2">
                Diagnose a plant
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <a href="#features" className="border border-white/10 hover:border-white/30 px-8 py-4 rounded-xl font-medium transition-all hover:bg-white/5">
                See what it does
              </a>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-4">
              <div>
                <p className="text-2xl font-bold text-[#a3cf8b]">98%</p>
                <p className="text-sm text-gray-500">Accuracy rate</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#a3cf8b]">50K+</p>
                <p className="text-sm text-gray-500">Plants diagnosed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#a3cf8b]">15min</p>
                <p className="text-sm text-gray-500">Average response</p>
              </div>
            </div>
          </div>

          {/* Right - Leaf Illustration Card */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#a3cf8b]/20 to-[#ff6a45]/20 blur-3xl rounded-full" />

            <div className="relative bg-gradient-to-br from-[#1a2a20] to-[#0d1a12] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-sm">
              <div className="flex justify-between items-center mb-6">
                <span className="font-mono text-xs text-gray-500">SAMPLE #04217</span>
                <span className="flex items-center gap-2 text-xs text-[#a3cf8b] font-mono">
                  <span className="w-1.5 h-1.5 bg-[#a3cf8b] rounded-full animate-pulse" />
                  SCANNING
                </span>
              </div>

              {/* Leaf SVG */}
              <div className="relative bg-black/30 rounded-xl p-4 border border-white/5">
                <svg viewBox="0 0 400 420" className="w-full h-auto" aria-hidden="true">
                  <defs>
                    <linearGradient id="leafGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a3cf8b" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#4f7a5b" stopOpacity="0.05" />
                    </linearGradient>
                    <linearGradient id="veinGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#a3cf8b" stopOpacity="0.1" />
                      <stop offset="50%" stopColor="#a3cf8b" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#a3cf8b" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>

                  <path
                    className="animate-[float_8s_ease-in-out_infinite]"
                    d="M200 30 C310 50, 370 140, 350 250 C330 360, 240 390, 200 390 C160 390, 70 360, 50 250 C30 140, 90 50, 200 30 Z"
                    fill="url(#leafGrad)"
                    stroke="#a3cf8b"
                    strokeWidth="1.5"
                    strokeOpacity="0.6"
                  />

                  <path
                    d="M200 40 L200 385"
                    stroke="#a3cf8b"
                    strokeWidth="1.5"
                    strokeOpacity="0.3"
                    className="animate-[pulse_4s_ease-in-out_infinite]"
                  />

                  {[[80, 120, 180, 250, 320], [80, 120, 180, 250, 320]].map((positions, idx) => (
                    <g key={idx}>
                      {positions.map((y, i) => (
                        <path
                          key={i}
                          d={idx === 0 ? `M200 ${y} C165 ${y + 10}, 130 ${y + 20}, 100 ${y + 40}` : `M200 ${y} C235 ${y + 10}, 270 ${y + 20}, 300 ${y + 40}`}
                          stroke="url(#veinGrad)"
                          strokeWidth="1"
                          strokeOpacity="0.3"
                          fill="none"
                        />
                      ))}
                    </g>
                  ))}

                  <circle className="fill-[#ff6a45] opacity-70 drop-shadow-[0_0_12px_rgba(255,106,69,0.5)]" cx="145" cy="180" r="12" />
                  <circle className="fill-[#ff6a45] opacity-50 drop-shadow-[0_0_8px_rgba(255,106,69,0.3)]" cx="260" cy="250" r="8" />
                  <circle className="fill-[#ff6a45] opacity-40 drop-shadow-[0_0_6px_rgba(255,106,69,0.2)]" cx="175" cy="300" r="6" />
                  <circle className="fill-[#ff8a63] opacity-30" cx="230" cy="140" r="5" />

                  <rect
                    className="animate-[scan_3.2s_ease-in-out_infinite]"
                    x="30"
                    y="40"
                    width="340"
                    height="2"
                    fill="#a3cf8b"
                    opacity="0.6"
                    rx="1"
                  />
                </svg>

                <div className="absolute top-1/4 left-[-4%] md:left-[-8%] bg-[#1a2a20]/95 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-xs font-mono shadow-xl">
                  <div className="text-[#ff6a45] font-semibold">EARLY BLIGHT</div>
                  <div className="text-gray-400 text-[10px]">Concentric ring, 9mm</div>
                </div>

                <div className="absolute bottom-1/3 right-[-4%] md:right-[-8%] bg-[#1a2a20]/95 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-xs font-mono shadow-xl">
                  <div className="text-[#ff8a63] font-semibold">LEAF RUST</div>
                  <div className="text-gray-400 text-[10px]">Orange pustule cluster</div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5">
                <div>
                  <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Likely cause</div>
                  <div className="font-semibold text-sm">Early Blight</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Confidence</div>
                  <div className="font-semibold text-sm text-[#a3cf8b] drop-shadow-[0_0_20px_rgba(163,207,139,0.3)]">91%</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Status</div>
                  <div className="flex items-center gap-1.5 text-xs text-[#a3cf8b]">
                    <span className="w-1.5 h-1.5 bg-[#a3cf8b] rounded-full animate-pulse" />
                    Active
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ===== FEATURES SECTION ===== */}
      <section id="features" className="relative z-10 py-20 px-6 md:px-12 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[#a3cf8b] font-mono text-sm tracking-widest uppercase mb-3 reveal opacity-0 translate-y-10 transition-all duration-700">What we offer</p>
          <h2 className="text-3xl md:text-4xl font-bold reveal opacity-0 translate-y-10 transition-all duration-700 delay-100">
            <span className="bg-gradient-to-r from-white to-[#a3cf8b] bg-clip-text text-transparent">Powerful features</span>
            <br />
            <span className="text-white/70">for every grower</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: '🔬',
              title: 'Visual Diagnosis',
              desc: 'Upload a photo of any leaf, stem, or fruit. The AI flags lesions, discoloration, and growth patterns tied to specific pathogens.',
              color: 'from-[#a3cf8b]/20 to-transparent'
            },
            {
              icon: '💬',
              title: 'Chat Assistant',
              desc: 'Type in a chat window and get instant answers — treatment timelines, dosages, and whether it\'s contagious to nearby plants.',
              color: 'from-[#ff6a45]/20 to-transparent'
            },
            {
              icon: '🌱',
              title: 'Grower\'s Feed',
              desc: 'Post your case, compare it against others, and see what actually worked for growers dealing with the same symptoms.',
              color: 'from-[#4a90d9]/20 to-transparent'
            }
          ].map((feature, i) => (
            <div
              key={i}
              className={`group bg-gradient-to-b ${feature.color} border border-white/5 rounded-2xl p-8 hover:border-white/20 transition-all hover:-translate-y-2 hover:shadow-2xl reveal opacity-0 translate-y-10 transition-all duration-700`}
              style={{ transitionDelay: `${i * 100 + 200}ms` }}
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-[#a3cf8b] transition-colors">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="relative z-10 py-20 px-6 md:px-12 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[#a3cf8b] font-mono text-sm tracking-widest uppercase mb-3 reveal opacity-0 translate-y-10 transition-all duration-700">Simple Process</p>
          <h2 className="text-3xl md:text-4xl font-bold reveal opacity-0 translate-y-10 transition-all duration-700 delay-100">
            <span className="text-white">How it works in</span>
            <span className="bg-gradient-to-r from-[#a3cf8b] to-[#ff8a63] bg-clip-text text-transparent"> 3 steps</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {[
            { step: '01', title: 'Take a Photo', desc: 'Snap a clear photo of the affected leaf, stem, or fruit using your phone.' },
            { step: '02', title: 'AI Analysis', desc: 'Our model analyzes the image against thousands of known plant diseases in seconds.' },
            { step: '03', title: 'Get Treatment', desc: 'Receive a detailed diagnosis, treatment plan, and care instructions.' }
          ].map((item, i) => (
            <div key={i} className="text-center reveal opacity-0 translate-y-10 transition-all duration-700" style={{ transitionDelay: `${i * 150 + 200}ms` }}>
              <div className="relative">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#a3cf8b]/20 to-[#ff6a45]/20 border border-white/10 flex items-center justify-center text-2xl font-bold text-[#a3cf8b] font-mono">
                  {item.step}
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 left-[60%] w-[40%] h-[2px] bg-gradient-to-r from-[#a3cf8b]/50 to-transparent" />
                )}
              </div>
              <h3 className="text-xl font-bold mt-4">{item.title}</h3>
              <p className="text-gray-400 text-sm mt-2">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="relative z-10 py-20 px-6 md:px-12 text-center max-w-4xl mx-auto">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#a3cf8b]/10 via-[#ff6a45]/10 to-[#a3cf8b]/10 blur-3xl" />

          <div className="relative bg-gradient-to-br from-[#1a2a20] to-[#0d1a12] border border-white/10 rounded-3xl p-12 md:p-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 reveal opacity-0 translate-y-10 transition-all duration-700">
              <span className="text-white">Your plant is showing symptoms.</span>
              <br />
              <span className="bg-gradient-to-r from-[#a3cf8b] to-[#ff8a63] bg-clip-text text-transparent">Let's find out why.</span>
            </h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto reveal opacity-0 translate-y-10 transition-all duration-700 delay-100">
              Join thousands of growers using AI to protect their plants.
            </p>
            <Link
              to="/signup"
              className="inline-block bg-gradient-to-r from-[#a3cf8b] to-[#7fb46a] text-[#0a0f0d] px-10 py-4 rounded-xl font-bold text-lg hover:shadow-[0_8px_30px_rgba(163,207,139,0.3)] transition-all hover:-translate-y-1 reveal opacity-0 translate-y-10 transition-all duration-700 delay-200"
            >
              Start Diagnosing Free →
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="relative z-10 border-t border-white/5 py-12 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🌱</span>
              <span className="font-mono text-sm tracking-widest font-bold bg-gradient-to-r from-[#a3cf8b] to-[#ff6a45] bg-clip-text text-transparent">
                PlantCheck
              </span>
            </div>
            <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
              AI-powered plant diagnosis for growers, farmers, and plant enthusiasts.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><Link to="/signup" className="hover:text-white transition-colors">Diagnose</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Log in</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="#" className="hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <span>&copy; {new Date().getFullYear()} PlantCheck. All rights reserved.</span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#a3cf8b] rounded-full animate-pulse" />
            All systems operational
          </span>
        </div>
      </footer>

      {/* Global Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-8px) rotate(1deg); }
          }
          @keyframes scan {
            0% { transform: translateY(0px); opacity: 0; }
            10% { opacity: 0.6; }
            90% { opacity: 0.6; }
            100% { transform: translateY(340px); opacity: 0; }
          }
          .reveal {
            opacity: 0;
            transform: translateY(10px);
            transition: opacity 0.7s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1);
          }
          .reveal.visible, .reveal.opacity-100 {
            opacity: 1;
            transform: translateY(0);
          }
        `
      }} />
    </div>
  );
}

export default HomePage;