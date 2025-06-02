
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Star, PlayCircle } from 'lucide-react';

const PastEventsSection = () => {
  const pastEvents = [
    {
      id: 1,
      title: "AI in Education Summit 2024",
      description: "Exploring the future of artificial intelligence in learning and teaching.",
      date: "2024-03-15",
      time: "14:00",
      location: "Virtual Event",
      attendees: 1250,
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=400&h=200&fit=crop",
      category: "Technology",
      featured: true
    },
    {
      id: 2,
      title: "Digital Marketing Masterclass",
      description: "Advanced strategies for social media marketing and content creation.",
      date: "2024-02-20",
      time: "16:00",
      location: "Lagos, Nigeria",
      attendees: 580,
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop",
      category: "Marketing"
    },
    {
      id: 3,
      title: "Entrepreneurship in Africa Forum",
      description: "Building successful startups across the African continent.",
      date: "2024-01-10",
      time: "10:00",
      location: "Nairobi, Kenya",
      attendees: 750,
      rating: 4.7,
      image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400&h=200&fit=crop",
      category: "Business"
    }
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-purple-50 to-orange-50">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">
            Past Events Highlights
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Relive the moments and insights from our previous events. Watch recordings and discover what you missed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {pastEvents.map((event) => (
            <Card key={event.id} className="group hover:shadow-xl transition-all duration-300 border-purple-100 overflow-hidden">
              <div className="relative">
                <img 
                  src={event.image} 
                  alt={event.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-white/90 text-purple-600 border-purple-200">
                    {event.category}
                  </Badge>
                </div>
                {event.featured && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-gradient-to-r from-orange-500 to-purple-600 text-white">
                      Featured
                    </Badge>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Button size="sm" className="bg-white/90 text-purple-600 hover:bg-white">
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Watch Recording
                  </Button>
                </div>
              </div>
              
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">{event.rating}</span>
                  </div>
                </div>
                <CardTitle className="text-lg leading-tight group-hover:text-purple-600 transition-colors">
                  {event.title}
                </CardTitle>
                <CardDescription className="text-sm">
                  {event.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{event.attendees.toLocaleString()} attended</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 border-purple-200 text-purple-600 hover:bg-purple-50">
                    View Details
                  </Button>
                  <Button size="sm" className="flex-1 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700">
                    Watch Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50" asChild>
            <Link to="/events">
              View All Past Events
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PastEventsSection;
