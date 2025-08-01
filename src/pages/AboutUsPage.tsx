
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AboutUsPage = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">About Us</h1>
            <p className="text-xl text-gray-600">
              Empowering learners and creators through innovative education
            </p>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  We believe in making quality education accessible to everyone, everywhere. 
                  Our platform connects passionate educators with eager learners, creating 
                  opportunities for growth and knowledge sharing.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>What We Do</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  We provide a comprehensive learning management system that enables 
                  creators to build, sell, and manage their courses and events while 
                  giving students an engaging and interactive learning experience.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Our Values</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li>• <strong>Accessibility:</strong> Making learning available to all</li>
                  <li>• <strong>Quality:</strong> Maintaining high standards in education</li>
                  <li>• <strong>Innovation:</strong> Embracing new technologies and methods</li>
                  <li>• <strong>Community:</strong> Building connections between learners and educators</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AboutUsPage;
