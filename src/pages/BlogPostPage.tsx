
import React from 'react';
import { useParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Clock } from 'lucide-react';

const BlogPostPage = () => {
  const { id } = useParams();

  return (
    <Layout>
      <div className="min-h-screen bg-light-purple">
        <div className="section-container py-16">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <Badge className="mb-4">AI</Badge>
              <h1 className="text-4xl font-bold mb-4">The Future of AI in Education</h1>
              
              <div className="flex items-center gap-6 text-gray-600 mb-6">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>John Doe</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>March 15, 2024</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>5 min read</span>
                </div>
              </div>
            </div>

            <div className="prose max-w-none">
              <p className="text-xl text-gray-600 mb-8">
                Artificial Intelligence is revolutionizing the education sector, bringing unprecedented 
                opportunities for personalized learning and enhanced educational experiences.
              </p>

              <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
              <p className="mb-6">
                The integration of AI in education is not just a futuristic concept—it's happening now. 
                From adaptive learning platforms to intelligent tutoring systems, AI is transforming 
                how we approach education at all levels.
              </p>

              <h2 className="text-2xl font-semibold mb-4">Key Areas of Impact</h2>
              <p className="mb-4">
                AI is making significant impacts in several key areas:
              </p>
              <ul className="list-disc list-inside mb-6 space-y-2">
                <li>Personalized learning experiences</li>
                <li>Automated assessment and feedback</li>
                <li>Intelligent content creation</li>
                <li>Predictive analytics for student success</li>
              </ul>

              <h2 className="text-2xl font-semibold mb-4">Looking Forward</h2>
              <p className="mb-6">
                As we look to the future, the potential for AI in education continues to expand. 
                We can expect to see even more sophisticated applications that will further 
                enhance the learning experience for students worldwide.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BlogPostPage;
