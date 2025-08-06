
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ForgotPasswordPage = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Forgot Password</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Forgot password page content will be implemented here.</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ForgotPasswordPage;
