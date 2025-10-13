import { Link } from 'react-router-dom';
import { Mail, Smartphone, CreditCard, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#1e1b4b] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="text-2xl font-bold text-white hover:text-indigo-300 transition-colors">
              SkillPulse
            </Link>
            <p className="mt-4 max-w-md text-gray-300">
              Skills and Event Booking Platform Marketplace. Connecting expertise with opportunity, 
              facilitating professional growth and development.
            </p>
            <div className="mt-6 flex items-center">
              <Mail size={16} className="mr-2 text-indigo-300" />
              <a href="mailto:help@skillpulse.cloud" className="hover:text-indigo-300 transition-colors">
                help@skillpulse.cloud
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 text-indigo-200">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-indigo-300 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-indigo-300 transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-gray-300 hover:text-indigo-300 transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/event-ticketing" className="text-gray-300 hover:text-indigo-300 transition-colors">
                  Event Ticketing
                </Link>
              </li>
              <li>
                <Link to="/help" className="text-gray-300 hover:text-indigo-300 transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-indigo-300 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/media" className="text-gray-300 hover:text-indigo-300 transition-colors">
                  Media
                </Link>
              </li>
              <li>
                <Link to="/verify" className="text-gray-300 hover:text-indigo-300 transition-colors">
                  Verify Certificate
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 text-indigo-200">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/learning" className="text-gray-300 hover:text-indigo-300 transition-colors">
                  My Learning
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-gray-300 hover:text-indigo-300 transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/explore-events" className="text-gray-300 hover:text-indigo-300 transition-colors">
                  Explore Events
                </Link>
              </li>
              <li>
                <Link to="/explore-courses" className="text-gray-300 hover:text-indigo-300 transition-colors">
                  Explore Courses
                </Link>
              </li>
              <li>
                <Link to="/community" className="text-gray-300 hover:text-indigo-300 transition-colors">
                  Community
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Mobile App Section */}
        <div className="mt-12 pt-8 border-t border-indigo-700">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <Smartphone className="h-6 w-6 text-orange-400" />
              <span className="text-lg font-semibold text-white">Download Our Mobile App</span>
            </div>
            <p className="text-gray-300 mb-6">Learn on the go with our mobile app</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {/* Google Play Store Button */}
              <Button 
                asChild
                className="h-12 px-6 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-none"
              >
                <a 
                  href="#" 
                  className="flex items-center gap-3"
                  onClick={(e) => e.preventDefault()}
                >
                  <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-4 h-4">
                      <path 
                        fill="#4285F4" 
                        d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5Z"
                      />
                      <path 
                        fill="#34A853" 
                        d="M16.81,15.12L6.05,21.34C5.76,21.53 5.4,21.53 5.06,21.34L3.84,21.85L13.69,12L16.81,15.12Z"
                      />
                      <path 
                        fill="#FBBC04" 
                        d="M20.16,10.85C20.5,11.05 20.75,11.36 20.75,12C20.75,12.64 20.5,12.95 20.16,13.15L16.81,15.12L13.69,12L16.81,8.88L20.16,10.85Z"
                      />
                      <path 
                        fill="#EA4335" 
                        d="M16.81,8.88L5.06,2.66C5.4,2.47 5.76,2.47 6.05,2.66L16.81,8.88L13.69,12L16.81,8.88Z"
                      />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-xs opacity-90">Get it on</div>
                    <div className="font-semibold">Google Play</div>
                  </div>
                </a>
              </Button>

              {/* App Store Button */}
              <Button 
                asChild
                className="h-12 px-6 bg-gradient-to-r from-purple-500 to-orange-600 hover:from-purple-600 hover:to-orange-700 text-white border-none"
              >
                <a 
                  href="#" 
                  className="flex items-center gap-3"
                  onClick={(e) => e.preventDefault()}
                >
                  <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-4 h-4">
                      <path 
                        fill="#000" 
                        d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z"
                      />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-xs opacity-90">Download on the</div>
                    <div className="font-semibold">App Store</div>
                  </div>
                </a>
              </Button>
            </div>
          </div>

          {/* Statement and Payment Methods Section */}
          <div className="text-center mb-8">
            <h4 className="text-xl font-bold text-white mb-6 bg-gradient-to-r from-orange-400 to-purple-500 bg-clip-text text-transparent">
              Built for the Skill-Driven Generation
            </h4>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
              {/* Payment Methods */}
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-orange-400" />
                <span className="text-sm text-gray-300">Cards Accepted</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-purple-400" />
                <span className="text-sm text-gray-300">Mobile Money - 19 African Countries</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-indigo-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">© {currentYear} SkillPulse. All rights reserved.</p>
            <div className="mt-4 md:mt-0 flex space-x-4">
              <Link to="/privacy" className="text-gray-400 hover:text-indigo-300 transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-400 hover:text-indigo-300 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
