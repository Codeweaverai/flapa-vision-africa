
import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">SP</span>
              </div>
              <span className="text-xl font-bold">SkillPulse</span>
            </div>
            <p className="text-gray-400 text-sm">
              Empowering minds through innovative learning experiences. Join thousands of learners worldwide in their journey to success.
            </p>
            <div className="flex space-x-4">
              <Facebook className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer" />
              <Twitter className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer" />
              <Instagram className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer" />
              <Linkedin className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer" />
              <Youtube className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer" />
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <div className="space-y-2">
              <Link to="/courses" className="block text-gray-400 hover:text-white text-sm">Courses</Link>
              <Link to="/events" className="block text-gray-400 hover:text-white text-sm">Events</Link>
              <Link to="/creators" className="block text-gray-400 hover:text-white text-sm">Creators</Link>
              <Link to="/about" className="block text-gray-400 hover:text-white text-sm">About</Link>
              <Link to="/gift-cards" className="block text-gray-400 hover:text-white text-sm">Gift Cards</Link>
              <Link to="/help" className="block text-gray-400 hover:text-white text-sm">Help Center</Link>
            </div>
          </div>

          {/* Learning */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Learning</h3>
            <div className="space-y-2">
              <Link to="/my-courses" className="block text-gray-400 hover:text-white text-sm">My Courses</Link>
              <Link to="/my-events" className="block text-gray-400 hover:text-white text-sm">My Events</Link>
              <Link to="/wishlist" className="block text-gray-400 hover:text-white text-sm">Wishlist</Link>
              <Link to="/community" className="block text-gray-400 hover:text-white text-sm">Community</Link>
              <Link to="/become-creator" className="block text-gray-400 hover:text-white text-sm">Become Creator</Link>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-gray-400 text-sm">
                <Mail className="h-4 w-4" />
                <span>hello@skillpulse.cloud</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400 text-sm">
                <Phone className="h-4 w-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400 text-sm">
                <MapPin className="h-4 w-4" />
                <span>San Francisco, CA</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-gray-800" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-gray-400 text-sm">
            © 2024 SkillPulse. All rights reserved.
          </div>
          <div className="flex space-x-6">
            <Link to="/privacy" className="text-gray-400 hover:text-white text-sm">Privacy Policy</Link>
            <Link to="/terms" className="text-gray-400 hover:text-white text-sm">Terms of Service</Link>
            <Link to="/contact" className="text-gray-400 hover:text-white text-sm">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
