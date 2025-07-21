
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-light-purple">
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-center mb-8">Privacy Policy</h1>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Last Updated: {new Date().toLocaleDateString()}</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p className="text-muted-foreground mb-6">
                  At SkillPulse, we are committed to protecting your privacy and ensuring the security of your personal information.
                  This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
                </p>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
                  
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
                  <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
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
                  <h2 className="text-2xl font-semibold mb-4">Information Sharing and Disclosure</h2>
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
                  <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
                  <p className="mb-4">
                    We implement appropriate technical and organizational measures to protect your personal information against
                    unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the
                    internet is 100% secure.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4">Your Rights and Choices</h2>
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
                  <h2 className="text-2xl font-semibold mb-4">Cookies and Tracking</h2>
                  <p className="mb-4">
                    We use cookies and similar technologies to enhance your experience, analyze usage patterns, and
                    personalize content. You can manage your cookie preferences through your browser settings.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
                  <p className="mb-4">
                    Our platform is not intended for children under 13 years of age. We do not knowingly collect
                    personal information from children under 13.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4">International Transfers</h2>
                  <p className="mb-4">
                    Your information may be transferred to and processed in countries other than your own.
                    We ensure appropriate safeguards are in place for such transfers.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4">Changes to This Privacy Policy</h2>
                  <p className="mb-4">
                    We may update this Privacy Policy from time to time. We will notify you of any material changes
                    by posting the new policy on this page and updating the "Last Updated" date.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
                  <p className="mb-4">
                    If you have any questions about this Privacy Policy or our data practices, please contact us at:
                  </p>
                  <div className="bg-muted p-4 rounded-lg">
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
