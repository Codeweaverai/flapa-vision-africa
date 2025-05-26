
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User } from 'lucide-react';

const BlogPage = () => {
  const posts = [
    {
      id: 1,
      title: "The Future of AI in Education",
      excerpt: "Exploring how artificial intelligence is transforming the way we learn and teach.",
      author: "John Doe",
      date: "March 15, 2024",
      category: "AI",
      readTime: "5 min read"
    },
    {
      id: 2,
      title: "Building Effective Online Communities",
      excerpt: "Best practices for creating and maintaining engaging online learning communities.",
      author: "Jane Smith",
      date: "March 12, 2024",
      category: "Community",
      readTime: "7 min read"
    },
    {
      id: 3,
      title: "Data Science Trends for 2024",
      excerpt: "Key trends and technologies that will shape the data science landscape this year.",
      author: "Mike Johnson",
      date: "March 10, 2024",
      category: "Data Science",
      readTime: "6 min read"
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-light-purple">
        <div className="section-container py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Our Blog</h1>
            <p className="text-xl text-gray-600">
              Insights, tutorials, and updates from our community
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Card key={post.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline">{post.category}</Badge>
                    <span className="text-sm text-gray-500">{post.readTime}</span>
                  </div>
                  <CardTitle className="text-xl hover:text-primary transition-colors">
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{post.excerpt}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{post.author}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{post.date}</span>
                    </div>
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

export default BlogPage;
