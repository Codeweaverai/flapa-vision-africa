
import React from 'react';
import Layout from '@/components/layout/Layout';

const TermsOfServicePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-orange-200">
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border-0 p-8">
            <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
              Terms of Service
            </h1>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-lg text-muted-foreground mb-8">
                Last updated: {new Date().toLocaleDateString()}
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
                <p className="mb-4">
                  By accessing and using this website, you accept and agree to be bound by the terms 
                  and provision of this agreement.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
                <p className="mb-4">
                  Permission is granted to temporarily download one copy of the materials on our website 
                  for personal, non-commercial transitory viewing only.
                </p>
                <h3 className="text-xl font-medium mb-2">This license shall automatically terminate if you violate any of these restrictions:</h3>
                <ul className="list-disc pl-6 mb-4">
                  <li>Modify or copy the materials</li>
                  <li>Use the materials for commercial purposes</li>
                  <li>Attempt to reverse engineer any software</li>
                  <li>Remove any copyright or proprietary notations</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. Disclaimer</h2>
                <p className="mb-4">
                  The materials on our website are provided on an 'as is' basis. We make no warranties, 
                  expressed or implied, and hereby disclaim all other warranties.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Limitations</h2>
                <p className="mb-4">
                  In no event shall our company or its suppliers be liable for any damages arising 
                  out of the use or inability to use the materials on our website.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Account Terms</h2>
                <p className="mb-4">When you create an account with us, you must provide accurate information and keep it updated.</p>
                <ul className="list-disc pl-6 mb-4">
                  <li>You are responsible for safeguarding your account password</li>
                  <li>You must not use your account for illegal activities</li>
                  <li>We reserve the right to terminate accounts that violate our terms</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Payment Terms</h2>
                <p className="mb-4">
                  Paid courses must be purchased before access is granted. Refunds are subject to our refund policy.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. Modifications</h2>
                <p className="mb-4">
                  We reserve the right to revise these terms at any time without notice. 
                  By using this website, you agree to be bound by the current version of these terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">8. Contact Information</h2>
                <p className="mb-4">
                  If you have any questions about these Terms of Service, please contact us at:
                </p>
                <p className="mb-4">
                  Email: support@skillpulse.com<br />
                  Address: [Your Company Address]
                </p>
              </section>
            </div>
          </div>
        </div>
      </Layout>
    </div>
  );
};

export default TermsOfServicePage;
