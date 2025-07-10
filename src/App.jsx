import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import appScreen from './assets/app-screen.jpeg';
import logo from './assets/logo.png';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';

function HomePage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="fixed w-full top-0 z-50 bg-white/95 backdrop-blur-md border-b border-white/20 shadow-lg">
        <nav className="py-4">
          <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Splitzy Logo" className="w-8 h-8" />
              <span className="text-2xl font-bold gradient-text">Splitzy</span>
            </div>
            <ul className="hidden md:flex space-x-8">
              <li><a href="#features" className="text-gray-600 hover:text-primary-500 font-medium transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="text-gray-600 hover:text-primary-500 font-medium transition-colors">How It Works</a></li>
              <li><a href="#testimonials" className="text-gray-600 hover:text-primary-500 font-medium transition-colors">Testimonials</a></li>
              <li><a href="#faq" className="text-gray-600 hover:text-primary-500 font-medium transition-colors">FAQ</a></li>
              <li><Link to="/privacy-policy" className="text-gray-600 hover:text-primary-500 font-medium transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-conditions" className="text-gray-600 hover:text-primary-500 font-medium transition-colors">Terms & Conditions</Link></li>
              <li><a href="#contact" className="text-gray-600 hover:text-primary-500 font-medium transition-colors">Contact</a></li>
            </ul>
            
            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </nav>
        
        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-md border-b border-white/20 shadow-lg">
            <ul className="py-4 px-6 space-y-4">
              <li><a href="#features" className="block text-gray-600 hover:text-primary-500 font-medium transition-colors py-2" onClick={() => setIsMobileMenuOpen(false)}>Features</a></li>
              <li><a href="#how-it-works" className="block text-gray-600 hover:text-primary-500 font-medium transition-colors py-2" onClick={() => setIsMobileMenuOpen(false)}>How It Works</a></li>
              <li><a href="#testimonials" className="block text-gray-600 hover:text-primary-500 font-medium transition-colors py-2" onClick={() => setIsMobileMenuOpen(false)}>Testimonials</a></li>
              <li><a href="#faq" className="block text-gray-600 hover:text-primary-500 font-medium transition-colors py-2" onClick={() => setIsMobileMenuOpen(false)}>FAQ</a></li>
              <li><Link to="/privacy-policy" className="block text-gray-600 hover:text-primary-500 font-medium transition-colors py-2" onClick={() => setIsMobileMenuOpen(false)}>Privacy Policy</Link></li>
              <li><Link to="/terms-conditions" className="block text-gray-600 hover:text-primary-500 font-medium transition-colors py-2" onClick={() => setIsMobileMenuOpen(false)}>Terms & Conditions</Link></li>
              <li><a href="#contact" className="block text-gray-600 hover:text-primary-500 font-medium transition-colors py-2" onClick={() => setIsMobileMenuOpen(false)}>Contact</a></li>
            </ul>
          </div>
        )}
      </header>

      <main>
        <section className="relative min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
          {/* Background Text */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
            <span className="text-[8rem] sm:text-[10rem] md:text-[16rem] lg:text-[20rem] font-black text-gray-300/20 tracking-wider transform -rotate-6">FRIENDS</span>
          </div>
          
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden z-0">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-primary-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-blue-500/10 to-primary-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-12 sm:pb-20">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center min-h-[80vh]">
              {/* Left Content */}
              <div className="text-center lg:text-left space-y-6 sm:space-y-8 order-2 lg:order-1">
                <div className="space-y-6">
                  <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-primary-200 text-primary-700 text-sm font-medium">
                    🎉 Join 50,000+ happy users splitting smarter
                  </div>
                  
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-gray-900 leading-tight">
                    Split Expenses,
                    <br />
                    <span className="bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Not Friendships
                    </span>
                  </h1>
                  
                  <p className="text-lg sm:text-xl md:text-2xl text-gray-600 font-medium leading-relaxed max-w-lg mx-auto lg:mx-0">
                    The easiest way to share expenses with friends, family, and roommates. Track, split, and settle up - all in one beautiful app.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button className="group bg-gradient-to-r from-primary-600 to-purple-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3">
                    <span>Get Started Free</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                  <button className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-full font-bold text-lg hover:border-primary-500 hover:text-primary-600 transition-all duration-300 hover:-translate-y-1">
                    Watch Demo
                  </button>
                </div>

                {/* Download Buttons */}
                <div className="flex flex-col gap-4">
                  <span className="text-sm text-gray-500 font-medium text-center lg:text-left">Download the app:</span>
                  <div className="flex flex-col sm:flex-row gap-3 items-center lg:items-start">
                    {/* App Store Button */}
                    <a href="#" className="group hover:scale-105 transition-all duration-300 hover:shadow-lg">
                      <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Download_on_the_App_Store_Badge.svg/2560px-Download_on_the_App_Store_Badge.svg.png" 
                        alt="Download on App Store" 
                        className="h-12 sm:h-14 w-40 sm:w-48 object-contain rounded-lg"
                      />
                    </a>
                    
                    {/* Google Play Button */}
                    <a href="#" className="group hover:scale-105 transition-all duration-300 hover:shadow-lg">
                      <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Google_Play_Store_badge_EN.svg/2560px-Google_Play_Store_badge_EN.svg.png" 
                        alt="Get it on Google Play" 
                        className="h-12 sm:h-14 w-40 sm:w-48 object-contain rounded-lg"
                      />
                    </a>
                  </div>
                </div>
              </div>

              {/* Right Content - Modern App Preview */}
              <div className="relative flex justify-center items-center lg:justify-end order-1 lg:order-2">
                {/* Main App Image Container */}
                <div className="relative group">
                  {/* Floating App Image */}
                  <div className="relative transform hover:scale-105 transition-all duration-700 animate-float">
                    {/* Glass Background */}
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl"></div>
                    
                    {/* App Screenshot */}
                    <img 
                      src={appScreen} 
                      alt="Splitzy App Interface" 
                      className="relative w-64 sm:w-72 md:w-80 lg:max-w-80 h-auto object-contain rounded-3xl shadow-2xl border border-white/30"
                    />
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-primary-500/30 via-transparent to-transparent rounded-3xl"></div>
                    
                    {/* Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>

                  {/* Floating UI Elements */}
                  <div className="absolute -top-8 -left-12 hidden lg:block">
                    <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/50 animate-bounce">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-bold text-gray-800">Expense Split!</span>
                      </div>
                    </div>
                  </div>

                  <div className="absolute -bottom-8 -right-12 hidden lg:block">
                    <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-white/50 animate-bounce" style={{animationDelay: '1s'}}>
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">📊</div>
                        <div>
                          <div className="text-sm font-semibold text-gray-700">Tracked Today</div>
                          <div className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">$347</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute top-1/2 -left-16 hidden lg:block">
                    <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-white/50 animate-pulse">
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-2xl">⭐</div>
                        <div className="text-xs font-bold text-gray-700">4.9 Rating</div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute top-16 -right-16 hidden lg:block">
                    <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-white/50 animate-pulse" style={{animationDelay: '2s'}}>
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-2xl">👥</div>
                        <div className="text-xs font-bold text-gray-700">50K+ Users</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Background Decorations */}
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-r from-pink-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-32 -left-32 w-56 h-56 bg-gradient-to-r from-blue-400/20 to-cyan-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
                <div className="absolute top-1/2 -right-24 w-40 h-40 bg-gradient-to-r from-yellow-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '3s'}}></div>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 sm:mt-20 text-center">
              <div className="inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-8 bg-white/60 backdrop-blur-sm rounded-2xl px-4 sm:px-8 py-4 border border-white/50">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <div className="w-6 sm:w-8 h-6 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full border-2 border-white"></div>
                    <div className="w-6 sm:w-8 h-6 sm:h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full border-2 border-white"></div>
                    <div className="w-6 sm:w-8 h-6 sm:h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full border-2 border-white"></div>
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-gray-700">50,000+ users</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex text-yellow-400 text-sm sm:text-base">
                    ⭐⭐⭐⭐⭐
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-gray-700">4.9/5 rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-green-500 text-lg sm:text-xl">✓</div>
                  <span className="text-xs sm:text-sm font-semibold text-gray-700">Bank-level security</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center text-gray-900 mb-12 sm:mb-16 scroll-animate">Why Choose Splitzy?</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <div className="group bg-white p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:scale-105 border border-gray-100 relative overflow-hidden scroll-animate-left">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 text-center sm:text-left">
                  <div className="text-4xl sm:text-5xl mb-4 sm:mb-6 transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300">💰</div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Effortless Bill Splitting</h3>
                  <p className="text-gray-600 leading-relaxed text-sm sm:text-base">Split bills quickly and fairly with our intuitive interface. No more calculator needed!</p>
                </div>
              </div>
              <div className="group bg-white p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:scale-105 border border-gray-100 relative overflow-hidden scroll-animate" style={{transitionDelay: '0.2s'}}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 text-center sm:text-left">
                  <div className="text-4xl sm:text-5xl mb-4 sm:mb-6 transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300">⚡</div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Real-time Balance Tracking</h3>
                  <p className="text-gray-600 leading-relaxed text-sm sm:text-base">Keep track of who owes what in real-time. Never lose track of expenses again.</p>
                </div>
              </div>
              <div className="group bg-white p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:scale-105 border border-gray-100 relative overflow-hidden scroll-animate-right sm:col-span-2 lg:col-span-1" style={{transitionDelay: '0.4s'}}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 text-center sm:text-left">
                  <div className="text-4xl sm:text-5xl mb-4 sm:mb-6 transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300">📱</div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Easy Mobile Access</h3>
                  <p className="text-gray-600 leading-relaxed text-sm sm:text-base">Access your expense data anywhere, anytime. Mobile-first design for convenience.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-5xl font-bold text-center text-gray-900 mb-16 scroll-animate">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-12">
              <div className="text-center group scroll-animate-scale">
                <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  1
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Create a Group</h3>
                <p className="text-gray-600 leading-relaxed">Start by creating a group with your friends, family, or roommates.</p>
              </div>
              <div className="text-center group scroll-animate-scale" style={{transitionDelay: '0.2s'}}>
                <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  2
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Add Expenses</h3>
                <p className="text-gray-600 leading-relaxed">Add shared expenses and let Splitzy calculate everyone's fair share.</p>
              </div>
              <div className="text-center group scroll-animate-scale" style={{transitionDelay: '0.4s'}}>
                <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  3
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Track & Manage</h3>
                <p className="text-gray-600 leading-relaxed">Keep track of all expenses and manage your shared costs easily.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="testimonials" className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-5xl font-bold text-center text-gray-900 mb-16 scroll-animate">What Our Users Say</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 border border-gray-100 relative overflow-hidden scroll-animate" style={{transitionDelay: '0.1s'}}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="mb-6">
                    <p className="text-gray-700 italic leading-relaxed">"Splitzy has made managing group expenses so much easier. No more awkward conversations about money!"</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-semibold group-hover:scale-110 transition-transform duration-300">
                      S
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Sarah Johnson</div>
                      <div className="text-sm text-gray-500">College Student</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 border border-gray-100 relative overflow-hidden scroll-animate" style={{transitionDelay: '0.3s'}}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="mb-6">
                    <p className="text-gray-700 italic leading-relaxed">"The real-time tracking feature is amazing. I always know exactly where we stand financially."</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-semibold group-hover:scale-110 transition-transform duration-300">
                      M
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Mike Chen</div>
                      <div className="text-sm text-gray-500">Working Professional</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 border border-gray-100 relative overflow-hidden scroll-animate" style={{transitionDelay: '0.5s'}}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="mb-6">
                    <p className="text-gray-700 italic leading-relaxed">"Perfect for roommates! We use it for all our shared expenses and it's been a game changer."</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-semibold group-hover:scale-110 transition-transform duration-300">
                      A
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Alex Rivera</div>
                      <div className="text-sm text-gray-500">Roommate</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-5xl font-bold text-center text-gray-900 mb-16 scroll-animate">Frequently Asked Questions</h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow duration-300 scroll-animate-left">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Is Splitzy free to use?</h3>
                <p className="text-gray-600 leading-relaxed">Yes! Splitzy offers a free basic version with all essential features. Premium plans are available for advanced features.</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow duration-300 scroll-animate-right">
                <h3 className="text-xl font-bold text-gray-900 mb-4">How secure is my data?</h3>
                <p className="text-gray-600 leading-relaxed">We use industry-standard encryption to ensure your expense data is completely secure and private.</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow duration-300 scroll-animate-left" style={{transitionDelay: '0.2s'}}>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Can I use Splitzy on mobile?</h3>
                <p className="text-gray-600 leading-relaxed">Absolutely! Splitzy is fully responsive and works great on all devices.</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow duration-300 scroll-animate-right" style={{transitionDelay: '0.2s'}}>
                <h3 className="text-xl font-bold text-gray-900 mb-4">How does expense splitting work?</h3>
                <p className="text-gray-600 leading-relaxed">Simply add expenses, select participants, and Splitzy automatically calculates fair shares for everyone.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-gradient-primary text-white relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-float" style={{animationDelay: '3s'}}></div>
          </div>
          
          <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-5xl font-bold mb-6">Ready to Start Splitting?</h2>
            <p className="text-xl mb-12 opacity-90 max-w-2xl mx-auto">Join thousands of users who have simplified their expense management with Splitzy.</p>
            <div className="flex flex-col items-center gap-8">
              <button className="bg-white text-primary-500 px-12 py-4 rounded-full font-bold text-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex items-center gap-3">
                <span>Get Started Free</span>
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1L15 8L8 15M15 8H1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                <a href="#" className="group hover:scale-105 transition-all duration-300 hover:shadow-lg">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Download_on_the_App_Store_Badge.svg/2560px-Download_on_the_App_Store_Badge.svg.png" 
                    alt="Download on App Store" 
                    className="h-14 w-48 object-contain rounded-lg"
                  />
                </a>
                
                <a href="#" className="group hover:scale-105 transition-all duration-300 hover:shadow-lg">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Google_Play_Store_badge_EN.svg/2560px-Google_Play_Store_badge_EN.svg.png" 
                    alt="Get it on Google Play" 
                    className="h-14 w-48 object-contain rounded-lg"
                  />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer id="contact" className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-20 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          {/* Main Content */}
          <div className="text-center mb-16">
            <h4 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Splitzy
              </span>
            </h4>
            <p className="text-xl text-gray-300 mb-12">Split Expenses, Not Friendships</p>
          </div>
          
          {/* Contact Info */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12 text-center">
            <div className="space-y-2">
              <h5 className="text-lg font-semibold text-white mb-3">Contact Us</h5>
              <p className="text-gray-300 text-sm sm:text-base">support@splitzy.in</p>
              <p className="text-gray-300 text-sm sm:text-base">+1 (555) 123-4567</p>
            </div>
            
            <div className="space-y-2">
              <h5 className="text-lg font-semibold text-white mb-3">Follow Us</h5>
              <div className="flex justify-center gap-3 sm:gap-4 flex-wrap">
                <a href="#" className="w-9 h-9 sm:w-10 sm:h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors duration-300 group">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="w-9 h-9 sm:w-10 sm:h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-blue-800 transition-colors duration-300 group">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="w-9 h-9 sm:w-10 sm:h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 transition-all duration-300 group">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="#" className="w-9 h-9 sm:w-10 sm:h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors duration-300 group">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <h5 className="text-lg font-semibold text-white mb-3">Legal</h5>
              <Link to="/terms-conditions" className="block text-gray-300 hover:text-primary-400 transition-colors text-sm sm:text-base">Terms & Conditions</Link>
              <Link to="/privacy-policy" className="block text-gray-300 hover:text-primary-400 transition-colors text-sm sm:text-base">Privacy Policy</Link>
            </div>
          </div>
          
          {/* Bottom Section */}
          <div className="pt-8 border-t border-gray-700/50 text-center">
            <div className="flex flex-col md:flex-row justify-center items-center gap-4">
              <p className="text-gray-400">&copy; 2025 Splitzy. All rights reserved.</p>
              <div className="hidden md:block w-px h-4 bg-gray-600"></div>
              <p className="text-gray-400">Made with ❤️ for better expense sharing</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-conditions" element={<TermsConditions />} />
      </Routes>
    </Router>
  );
}

export default App;
