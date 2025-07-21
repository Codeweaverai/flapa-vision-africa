
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TermsOfServicePage = () => {
  return (
    <div className="min-h-screen bg-light-purple">
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-center mb-8">Terms of Service</h1>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Last Updated: {new Date().toLocaleDateString()}</CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p className="text-muted-foreground mb-6">
                  Welcome to SkillPulse. These Terms of Service ("Terms") govern your use of our platform and services.
                  By accessing or using SkillPulse, you agree to be bound by these Terms.
                </p>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
                  <p className="mb-4">
                    By creating an account or using our services, you agree to these Terms and our Privacy Policy.
                    If you do not agree with these terms, please do not use our platform.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
                  <p className="mb-4">
                    SkillPulse is an online learning platform that connects students with instructors and provides
                    access to courses, events, and educational content. We offer both free and paid content.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
                  <h3 className="text-xl font-medium mb-2">Account Creation</h3>
                  <ul className="list-disc pl-6 mb-4">
                    <li>You must provide accurate and complete information when creating an account</li>
                    <li>You are responsible for maintaining the security of your account credentials</li>
                    <li>You must be at least 13 years old to create an account</li>
                    <li>One person may not maintain multiple accounts</li>
                  </ul>

                  <h3 className="text-xl font-medium mb-2">Account Responsibilities</h3>
                  <ul className="list-disc pl-6 mb-4">
                    <li>You are responsible for all activities that occur under your account</li>
                    <li>Notify us immediately of any unauthorized use of your account</li>
                    <li>Keep your account information up to date</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4">4. Content and Intellectual Property</h2>
                  <h3 className="text-xl font-medium mb-2">Our Content</h3>
                  <p className="mb-4">
                    All content on SkillPulse, including but not limited to text, graphics, logos, videos, and software,
                    is owned by SkillPulse or its content suppliers and is protected by intellectual property laws.
                  </p>

                  <h3 className="text-xl font-medium mb-2">User-Generated Content</h3>
                  <ul className="list-disc pl-6 mb-4">
                    <li>You retain ownership of content you create and submit to the platform</li>
                    <li>You grant us a license to use, display, and distribute your content on our platform</li>
                    <li>You represent that you have the right to share all content you submit</li>
                    <li>You are responsible for ensuring your content does not violate any laws or third-party rights</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4">5. Prohibited Uses</h2>
                  <p className="mb-4">You may not use our platform to:</p>
                  <ul className="list-disc pl-6 mb-4">
                    <li>Violate any applicable laws or regulations</li>
                    <li>Infringe on intellectual property rights</li>
                    <li>Share harmful, offensive, or inappropriate content</li>
                    <li>Spam, harass, or abuse other users</li>
                    <li>Attempt to gain unauthorized access to our systems</li>
                    <li>Use automated tools to access or scrape our content</li>
                    <li>Impersonate another person or entity</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4">6. Payments and Refunds</h2>
                  <h3 className="text-xl font-medium mb-2">Payments</h3>
                  <ul className="list-disc pl-6 mb-4">
                    <li>Payment is required for premium courses and events</li>
                    <li>All prices are listed in the specified currency</li>
                    <li>Payment processing is handled by secure third-party providers</li>
                    <li>You authorize us to charge your selected payment method</li>
                  </ul>

                  <h3 className="text-xl font-medium mb-2">Refunds</h3>
                  <ul className="list-disc pl-6 mb-4">
                    <li>We offer a 30-day money-back guarantee for courses</li>
                    <li>Refund requests must be submitted within the specified timeframe</li>
                    <li>Event tickets may have different refund policies</li>
                    <li>Refunds are processed to the original payment method</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4">7. Creator Terms</h2>
                  <h3 className="text-xl font-medium mb-2">Content Creation</h3>
                  <ul className="list-disc pl-6 mb-4">
                    <li>Creators must provide high-quality, original content</li>
                    <li>Content must comply with our community guidelines</li>
                    <li>Creators are responsible for the accuracy of their content</li>
                    <li>We reserve the right to remove content that violates our policies</li>
                  </ul>

                  <h3 className="text-xl font-medium mb-2">Revenue Sharing</h3>
                  <ul className="list-disc pl-6 mb-4">
                    <li>Creators receive a percentage of revenue from their content sales</li>
                    <li>Platform fees are deducted from gross revenue</li>
                    <li>Payments are processed according to our payout schedule</li>
                    <li>Tax responsibilities lie with individual creators</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4">8. Privacy and Data Protection</h2>
                  <p className="mb-4">
                    Your privacy is important to us. Please review our Privacy Policy to understand how we
                    collect, use, and protect your personal information.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4">9. Disclaimers and Limitations</h2>
                  <h3 className="text-xl font-medium mb-2">Service Availability</h3>
                  <ul className="list-disc pl-6 mb-4">
                    <li>We strive for 99.9% uptime but cannot guarantee uninterrupted service</li>
                    <li>We may temporarily suspend service for maintenance</li>
                    <li>We are not liable for any losses due to service interruptions</li>
                  </ul>

                  <h3 className="text-xl font-medium mb-2">Content Disclaimer</h3>
                  <ul className="list-disc pl-6 mb-4">
                    <li>Course content is provided for educational purposes only</li>
                    <li>We do not guarantee specific learning outcomes or career results</li>
                    <li>Users are responsible for verifying the accuracy of information</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4">10. Termination</h2>
                  <p className="mb-4">
                    We may terminate or suspend your account at any time for violations of these Terms.
                    You may also delete your account at any time through your account settings.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4">11. Changes to Terms</h2>
                  <p className="mb-4">
                    We may update these Terms from time to time. We will notify users of significant changes
                    and obtain consent where required by law.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4">12. Governing Law</h2>
                  <p className="mb-4">
                    These Terms are governed by the laws of the jurisdiction where SkillPulse is incorporated.
                    Any disputes will be resolved through binding arbitration.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4">13. Contact Information</h2>
                  <p className="mb-4">
                    If you have questions about these Terms of Service, please contact us:
                  </p>
                  <div className="bg-muted p-4 rounded-lg">
                    <p><strong>Email:</strong> help@skillpulse.com</p>
                    <p><strong>Subject:</strong> Terms of Service Inquiry</p>
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

export default TermsOfServicePage;
