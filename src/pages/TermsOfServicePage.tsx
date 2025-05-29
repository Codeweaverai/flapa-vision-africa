
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TermsOfServicePage = () => {
  return (
    <Layout>
      <div className="section-container py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Terms of Service</CardTitle>
              <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none">
              <h2>1. Acceptance of Terms</h2>
              <p>
                By accessing and using SkillPulse, you accept and agree to be bound by the terms 
                and provision of this agreement.
              </p>

              <h2>2. Use License</h2>
              <p>
                Permission is granted to temporarily access the materials on SkillPulse for personal, 
                non-commercial transitory viewing only.
              </p>

              <h2>3. User Accounts</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account and password 
                and for restricting access to your computer.
              </p>

              <h2>4. Course Content</h2>
              <p>
                All course materials are provided for educational purposes. You may not reproduce, 
                distribute, or create derivative works from our content without permission.
              </p>

              <h2>5. Payment Terms</h2>
              <p>
                All fees are non-refundable unless otherwise specified. Prices are subject to change 
                without notice.
              </p>

              <h2>6. Prohibited Uses</h2>
              <p>
                You may not use our service for any unlawful purpose or to solicit others to perform 
                unlawful acts.
              </p>

              <h2>7. Disclaimer</h2>
              <p>
                The materials on SkillPulse are provided on an 'as is' basis. SkillPulse makes no 
                warranties, expressed or implied.
              </p>

              <h2>8. Limitations</h2>
              <p>
                In no event shall SkillPulse or its suppliers be liable for any damages arising out 
                of the use or inability to use the materials on SkillPulse.
              </p>

              <h2>9. Modifications</h2>
              <p>
                SkillPulse may revise these terms of service at any time without notice. By using 
                this platform, you agree to be bound by the current version.
              </p>

              <h2>10. Contact Information</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us at 
                legal@skillpulse.com.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default TermsOfServicePage;
