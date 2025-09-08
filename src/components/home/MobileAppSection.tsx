import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Smartphone, Download, Star, Users } from 'lucide-react';

const MobileAppSection = () => {
  return (
    <section className="section-container relative overflow-hidden bg-gradient-to-br from-orange-400/5 to-purple-500/5">
      {/* Content container with relative positioning */}
      <div className="relative z-10 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <Smartphone className="h-8 w-8 text-orange-500" />
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Download Our App
            </span>
          </div>
          <h2 className="heading-lg mb-4">
            Learn Anywhere, Anytime with Our 
            <span className="text-gradient ml-2">Mobile App</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Get the full SkillPulse experience on your mobile device. Access courses, 
            join events, and learn on the go with our feature-rich mobile application.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - App features */}
          <div className="space-y-8">
            <div className="grid sm:grid-cols-2 gap-6">
              <Card className="border-none shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-orange-500/10">
                      <Download className="h-5 w-5 text-orange-600" />
                    </div>
                    <h3 className="font-semibold">Offline Learning</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Download courses and learn without internet connection
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <h3 className="font-semibold">Community</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Connect with learners and instructors in our community
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-6 rounded-2xl text-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current text-yellow-300" />
                  ))}
                </div>
                <span className="font-semibold">4.8/5 Rating</span>
              </div>
              <p className="text-sm opacity-90 mb-4">
                "The mobile app has completely transformed my learning experience. 
                I can now learn during my commute and sync perfectly with the web platform."
              </p>
              <p className="text-xs opacity-75">- Sarah M., Mobile User</p>
            </div>
          </div>

          {/* Right side - Download buttons */}
          <div className="text-center lg:text-left">
            <div className="bg-gradient-to-br from-white/80 to-white/40 dark:from-gray-900/80 dark:to-gray-800/40 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-purple-600 mb-4">
                  <Smartphone className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Download SkillPulse</h3>
                <p className="text-muted-foreground">Available on all platforms</p>
              </div>

              <div className="space-y-4">
                {/* Google Play Store Button */}
                <Button 
                  asChild
                  className="w-full h-14 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-none"
                >
                  <a 
                    href="#" 
                    className="flex items-center justify-center gap-3"
                    onClick={(e) => e.preventDefault()}
                  >
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-5 h-5">
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
                  className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-none"
                >
                  <a 
                    href="#" 
                    className="flex items-center justify-center gap-3"
                    onClick={(e) => e.preventDefault()}
                  >
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-5 h-5">
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

              <div className="mt-6 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Download className="h-4 w-4" />
                    <span>50K+ Downloads</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    <span>4.8 Rating</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MobileAppSection;
