import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Decorative background elements matching other pages */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-orange-300/30 to-purple-400/30 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-40 h-40 bg-gradient-to-r from-purple-300/20 to-pink-400/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-1/4 w-28 h-28 bg-gradient-to-r from-orange-400/25 to-purple-500/25 rounded-full blur-xl"></div>
      </div>
      
      <Layout>
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
              Privacy Policy
            </h1>
            
            <Card className="mb-6 bg-white/90 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl">Last Updated: {new Date().toLocaleDateString()}</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p className="text-muted-foreground mb-6">
                  At SkillPulse, we are committed to protecting your privacy and ensuring the security of your personal information.
                  This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
                </p>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                    Information We Collect
                  </h2>
                  
                  <h3 className="text-xl font-medium mb-2">Personal Information</h3>
                  <p className="mb-4">We may collect the following personal information:</p>
                  <ul className="list-disc pl-6 mb-4">
                    <li>Name and contact information (email address, phone number)</li>
                    <li>Profile information (bio, profile picture, professional background)</li>
                    <li>Payment and billing information</li>
                    <li>Educational and professional credentials</li>
                    <li>Course enrollment and progress data</li>
                  </ul>

                  <h3 className="text-xl font-medium mb-2">Usage Information</h3>
                  <p className="mb-4">We automatically collect certain information when you use our platform:</p>
                  <ul className="list-disc pl-6 mb-4">
                    <li>Device information (IP address, browser type, operating system)</li>
                    <li>Usage data (pages visited, time spent, features used)</li>
                    <li>Cookies and similar tracking technologies</li>
                    <li>Log files and analytics data</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                    How We Use Your Information
                  </h2>
                  <p className="mb-4">We use your information for the following purposes:</p>
                  <ul className="list-disc pl-6 mb-4">
                    <li>Provide and maintain our educational platform</li>
                    <li>Process payments and manage subscriptions</li>
                    <li>Communicate with you about courses, events, and updates</li>
                    <li>Personalize your learning experience</li>
                    <li>Improve our services and develop new features</li>
                    <li>Ensure platform security and prevent fraud</li>
                    <li>Comply with legal obligations</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                    Information Sharing and Disclosure
                  </h2>
                  <p className="mb-4">We may share your information in the following circumstances:</p>
                  <ul className="list-disc pl-6 mb-4">
                    <li>With instructors and course creators (limited to necessary course-related information)</li>
                    <li>With service providers who assist us in operating our platform</li>
                    <li>When required by law or to protect our rights</li>
                    <li>In connection with a business transaction (merger, acquisition, etc.)</li>
                    <li>With your explicit consent</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                    Data Security
                  </h2>
                  <p className="mb-4">
                    We implement appropriate technical and organizational measures to protect your personal information against
                    unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the
                    internet is 100% secure.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                    Your Rights and Choices
                  </h2>
                  <p className="mb-4">You have the following rights regarding your personal information:</p>
                  <ul className="list-disc pl-6 mb-4">
                    <li>Access and review your personal information</li>
                    <li>Correct inaccurate or incomplete information</li>
                    <li>Delete your account and personal information</li>
                    <li>Opt-out of marketing communications</li>
                    <li>Request data portability</li>
                    <li>Object to certain data processing activities</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                    Cookies and Tracking
                  </h2>
                  <p className="mb-4">
                    We use cookies and similar technologies to enhance your experience, analyze usage patterns, and
                    personalize content. You can manage your cookie preferences through your browser settings.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                    Children's Privacy
                  </h2>
                  <p className="mb-4">
                    Our platform is not intended for children under 13 years of age. We do not knowingly collect
                    personal information from children under 13.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                    International Transfers
                  </h2>
                  <p className="mb-4">
                    Your information may be transferred to and processed in countries other than your own.
                    We ensure appropriate safeguards are in place for such transfers.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                    Changes to This Privacy Policy
                  </h2>
                  <p className="mb-4">
                    We may update this Privacy Policy from time to time. We will notify you of any material changes
                    by posting the new policy on this page and updating the "Last Updated" date.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                    Contact Us
                  </h2>
                  <p className="mb-4">
                    If you have any questions about this Privacy Policy or our data practices, please contact us at:
                  </p>
                  <div className="bg-gradient-to-r from-orange-50 to-purple-50 p-4 rounded-lg border border-orange-200">
                    <p><strong>Email:</strong> help@skillpulse.com</p>
                    <p><strong>Subject:</strong> Privacy Policy Inquiry</p>
                  </div>
                </section>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    </div>
  );
};

export default PrivacyPolicyPage;
