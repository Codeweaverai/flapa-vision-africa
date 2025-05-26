
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Star } from 'lucide-react';

const CoursesPage = () => {
  const courses = [
    {
      id: 1,
      title: "Introduction to AI",
      description: "Learn the fundamentals of artificial intelligence and machine learning.",
      duration: "4 weeks",
      students: 1250,
      rating: 4.8,
      price: 99,
      level: "Beginner"
    },
    {
      id: 2,
      title: "Advanced Data Science",
      description: "Deep dive into data science techniques and advanced analytics.",
      duration: "8 weeks",
      students: 890,
      rating: 4.9,
      price: 199,
      level: "Advanced"
    },
    {
      id: 3,
      title: "Web Development Bootcamp",
      description: "Complete guide to modern web development with React and Node.js.",
      duration: "12 weeks",
      students: 2100,
      rating: 4.7,
      price: 299,
      level: "Intermediate"
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-light-purple">
        <div className="section-container py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Our Courses</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover our comprehensive collection of courses designed to help you master new skills
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline">{course.level}</Badge>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{course.rating}</span>
                    </div>
                  </div>
                  <CardTitle className="text-xl">{course.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{course.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{course.students.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">${course.price}</span>
                    <Button>Enroll Now</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CoursesPage;
