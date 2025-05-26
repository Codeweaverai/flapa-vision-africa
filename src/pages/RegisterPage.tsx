
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const RegisterPage = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Register</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Register page content will be implemented here.</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default RegisterPage;
