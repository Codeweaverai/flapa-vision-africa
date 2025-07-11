
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Globe, Users, Calendar } from 'lucide-react';

const localContent = [
  {
    id: 1,
    type: 'workshop',
    title: 'Local Entrepreneurship Workshop',
    description: 'Connect with local business leaders and learn region-specific strategies',
    location: 'Kampala, Uganda',
    date: 'March 15, 2024',
    participants: 45,
    language: 'English & Luganda'
  },
  {
    id: 2,
    type: 'course',
    title: 'East African Market Analysis',
    description: 'Understanding business opportunities across East Africa',
    location: 'Nairobi, Kenya',
    date: 'Ongoing',
    participants: 230,
    language: 'English & Swahili'
  },
  {
    id: 3,
    type: 'event',
    title: 'Community Leaders Summit',
    description: 'Bringing together change-makers from across the region',
    location: 'Kigali, Rwanda',
    date: 'April 8-10, 2024',
    participants: 120,
    language: 'English & Kinyarwanda'
  }
];

const LocalContentSection = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <MapPin className="h-8 w-8 text-green-600" />
            <h2 className="text-3xl md:text-4xl font-bold">
              Local <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">Content</span>
            </h2>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Connect with your local community through region-specific courses, workshops, and events
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {localContent.map((content) => (
            <Card key={content.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Badge 
                    variant={content.type === 'course' ? 'default' : 'secondary'}
                  >
                    {content.type.toUpperCase()}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <MapPin className="h-4 w-4" />
                    <span className="text-xs">{content.location}</span>
                  </div>
                </div>
                <CardTitle className="text-lg leading-tight">{content.title}</CardTitle>
                <CardDescription>{content.description}</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{content.date}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>{content.participants}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Globe className="h-4 w-4" />
                    <span>{content.language}</span>
                  </div>
                  
                  <Button className="w-full">
                    {content.type === 'course' ? 'Enroll Now' : 'Join Event'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-8">
          <Button size="lg" variant="outline">
            Explore Local Content
          </Button>
        </div>
      </div>
    </section>
  );
};

export default LocalContentSection;
