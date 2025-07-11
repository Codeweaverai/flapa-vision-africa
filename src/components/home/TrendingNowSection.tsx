
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Clock, Users, Star } from 'lucide-react';

const trendingItems = [
  {
    id: 1,
    type: 'course',
    title: 'AI and Machine Learning Fundamentals',
    description: 'Learn the basics of artificial intelligence and machine learning',
    instructor: 'Dr. Alex Martinez',
    duration: '8 weeks',
    students: 2340,
    rating: 4.8,
    trend: '+150% this week'
  },
  {
    id: 2,
    type: 'course',
    title: 'Sustainable Business Practices',
    description: 'Build environmentally conscious business strategies',
    instructor: 'Sarah Green',
    duration: '6 weeks',
    students: 1890,
    rating: 4.9,
    trend: '+95% this week'
  },
  {
    id: 3,
    type: 'event',
    title: 'Digital Marketing Summit 2024',
    description: 'Join industry leaders discussing the future of digital marketing',
    instructor: 'Marketing Experts Panel',
    duration: '2 days',
    students: 850,
    rating: 4.7,
    trend: '+200% this week'
  }
];

const TrendingNowSection = () => {
  return (
    <section className="py-16 bg-gradient-to-br from-orange-50 to-purple-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className="h-8 w-8 text-orange-500" />
            <h2 className="text-3xl md:text-4xl font-bold">
              Trending Now
            </h2>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover the most popular courses and events that learners are choosing right now
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {trendingItems.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow border-2 hover:border-orange-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Badge 
                    variant={item.type === 'course' ? 'default' : 'secondary'}
                    className="mb-2"
                  >
                    {item.type.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {item.trend}
                  </Badge>
                </div>
                <CardTitle className="text-lg leading-tight">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">
                    by {item.instructor}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{item.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{item.students}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{item.rating}</span>
                    </div>
                  </div>
                  
                  <Button className="w-full">
                    {item.type === 'course' ? 'Enroll Now' : 'Register'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-8">
          <Button size="lg" variant="outline">
            View All Trending
          </Button>
        </div>
      </div>
    </section>
  );
};

export default TrendingNowSection;
