
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PricingPage = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Pricing page content will be implemented here.</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PricingPage;
