import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';

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
        
        <div className="mt-12 pt-8 border-t border-indigo-700">
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
