
import React from 'react';
import { useParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, BookOpen, CheckCircle } from 'lucide-react';

const CourseLearningPage = () => {
  const { id } = useParams();

  return (
    <Layout>
      <div className="min-h-screen bg-light-purple">
        <div className="section-container py-8">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Course Content Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Course Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-primary/10 rounded">
                    <Play className="h-4 w-4" />
                    <span className="text-sm">Introduction</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <BookOpen className="h-4 w-4" />
                    <span className="text-sm">Chapter 1</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Chapter 2</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              <Card>
                <CardContent className="p-0">
                  <div className="aspect-video bg-black rounded-t-lg flex items-center justify-center">
                    <Button size="lg" className="rounded-full h-16 w-16">
                      <Play className="h-8 w-8" />
                    </Button>
                  </div>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold mb-4">Course Introduction</h1>
                    <p className="text-gray-600 mb-6">
                      Welcome to this comprehensive course. In this introduction, we'll cover
                      what you'll learn and how to get the most out of this course.
                    </p>
                    <div className="flex gap-4">
                      <Button>Mark as Complete</Button>
                      <Button variant="outline">Next Lesson</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CourseLearningPage;
