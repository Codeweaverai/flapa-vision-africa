
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-flapabay-dark text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="text-2xl font-bold">
              SkillPulse
            </Link>
            <p className="mt-4 max-w-md">
              Skills and Event Booking Platform Marketplace. Connecting expertise with opportunity, 
              facilitating professional growth and development.
            </p>
            <div className="mt-6 flex items-center">
              <Mail size={16} className="mr-2" />
              <a href="mailto:contact@skillpulse.com" className="hover:text-primary transition-colors">
                contact@skillpulse.com
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-primary transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link to="/ventures" className="hover:text-primary transition-colors">
                  Ventures
                </Link>
              </li>
              <li>
                <Link to="/speaking" className="hover:text-primary transition-colors">
                  Speaking & Media
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/ai-animations" className="hover:text-primary transition-colors">
                  AI Animations
                </Link>
              </li>
              <li>
                <Link to="/learning" className="hover:text-primary transition-colors">
                  Learning
                </Link>
              </li>
              <li>
                <Link to="/events" className="hover:text-primary transition-colors">
                  Events
                </Link>
              </li>
              <li>
                <Link to="/consult" className="hover:text-primary transition-colors">
                  Book a Consultation
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p>© {currentYear} SkillPulse. All rights reserved.</p>
            <div className="mt-4 md:mt-0 flex space-x-4">
              <Link to="/privacy" className="hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-primary transition-colors">
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
