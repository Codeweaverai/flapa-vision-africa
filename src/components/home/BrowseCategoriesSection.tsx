
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Code, Briefcase, Camera, Music, Heart } from 'lucide-react';

const categories = [
  {
    icon: BookOpen,
    title: 'Business',
    description: 'Leadership, entrepreneurship, and business skills',
    count: '150+ courses'
  },
  {
    icon: Code,
    title: 'Technology',
    description: 'Programming, web development, and IT skills',
    count: '200+ courses'
  },
  {
    icon: Briefcase,
    title: 'Professional',
    description: 'Career development and workplace skills',
    count: '120+ courses'
  },
  {
    icon: Camera,
    title: 'Creative',
    description: 'Design, photography, and creative arts',
    count: '80+ courses'
  },
  {
    icon: Music,
    title: 'Arts & Music',
    description: 'Music production, performance, and fine arts',
    count: '60+ courses'
  },
  {
    icon: Heart,
    title: 'Health & Wellness',
    description: 'Fitness, nutrition, and mental health',
    count: '90+ courses'
  }
];

const BrowseCategoriesSection = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Browse by Category
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover courses across various categories and find the perfect learning path for your goals
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => {
            const IconComponent = category.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{category.title}</CardTitle>
                      <CardDescription className="text-sm text-gray-500">
                        {category.count}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{category.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <div className="text-center mt-8">
          <Button size="lg">
            View All Categories
          </Button>
        </div>
      </div>
    </section>
  );
};

export default BrowseCategoriesSection;
