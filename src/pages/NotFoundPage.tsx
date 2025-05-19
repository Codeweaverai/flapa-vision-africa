
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout/Layout';

const NotFoundPage = () => {
  return (
    <Layout>
      <div className="section-container py-16 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="mb-6">
            <span className="text-8xl font-bold text-primary">404</span>
          </div>
          <h1 className="text-3xl font-bold mb-4">Page Not Found</h1>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            The page you are looking for doesn't exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild>
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Home
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/learning">
                Explore Courses
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFoundPage;
