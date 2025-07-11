
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, Users, BookOpen } from 'lucide-react';

const featuredCreators = [
  {
    id: 1,
    name: 'Sarah Johnson',
    title: 'Business Strategy Expert',
    avatar: '/placeholder.svg',
    rating: 4.9,
    students: 15420,
    courses: 12,
    specialties: ['Leadership', 'Strategy', 'Management']
  },
  {
    id: 2,
    name: 'Michael Chen',
    title: 'Full Stack Developer',
    avatar: '/placeholder.svg',
    rating: 4.8,
    students: 8930,
    courses: 8,
    specialties: ['React', 'Node.js', 'MongoDB']
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    title: 'UX/UI Designer',
    avatar: '/placeholder.svg',
    rating: 4.9,
    students: 12340,
    courses: 15,
    specialties: ['Design Systems', 'Figma', 'User Research']
  }
];

const CreatorsSection = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Learn from Expert <span className="bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">Creators</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join thousands of students learning from industry professionals and thought leaders
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {featuredCreators.map((creator) => (
            <Card key={creator.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <Avatar className="h-20 w-20 mx-auto mb-4">
                  <AvatarImage src={creator.avatar} alt={creator.name} />
                  <AvatarFallback className="text-lg font-semibold">
                    {creator.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <h3 className="font-semibold text-lg mb-1">{creator.name}</h3>
                <p className="text-gray-600 mb-4">{creator.title}</p>
                
                <div className="flex justify-center items-center gap-4 mb-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{creator.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{creator.students.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{creator.courses}</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {creator.specialties.map((specialty) => (
                    <Badge key={specialty} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>
                
                <Button variant="outline" className="w-full">
                  View Profile
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-8">
          <Button size="lg">
            Browse All Creators
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CreatorsSection;
