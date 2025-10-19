import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, ArrowRight, Star, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Event, fetchEvents } from '@/services/eventService';
import { format, parseISO, isAfter } from 'date-fns';
import PriceDisplay from '@/components/currency/PriceDisplay';
import { supabase } from '@/lib/supabaseClient';
import WishlistButton from '@/components/wishlist/WishlistButton';

interface EventWithReviews extends Event {
  reviews?: {
    avg_rating: number;
    total_reviews: number;
  };
  total_attendees?: number;
}

const EventsSection = () => {
  const [events, setEvents] = useState<EventWithReviews[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const eventsData = await fetchEvents();
      
      // Fetch reviews and bookings for all events
      const eventsWithDetails = await Promise.all(
        eventsData.map(async (event) => {
          const [reviewsResult, bookingsResult] = await Promise.allSettled([
            // Fetch reviews
            supabase
              .from('event_reviews')
              .select('rating')
              .eq('event_id', event.id),
            // Fetch bookings for attendee count
            supabase
              .from('event_bookings')
              .select('id')
              .eq('event_id', event.id)
          ]);

          const reviews = reviewsResult.status === 'fulfilled' && !reviewsResult.value.error ? 
            reviewsResult.value.data : [];
          const bookings = bookingsResult.status === 'fulfilled' && !bookingsResult.value.error ? 
            bookingsResult.value.data : [];

          const totalReviews = reviews?.length || 0;
          const avgRating = totalReviews > 0 
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
            : 0;

          return {
            ...event,
            reviews: {
              avg_rating: avgRating,
              total_reviews: totalReviews
            },
            total_attendees: bookings.length
          };
        })
      );

      // Filter for upcoming events only
      const upcomingEvents = eventsWithDetails
        .filter(event => isAfter(parseISO(event.start_time), new Date()))
        .slice(0, 15); // Show 15 events for horizontal scrolling
      
      setEvents(upcomingEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create infinite scroll effect by duplicating events
  const duplicatedEvents = [...events, ...events, ...events];

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -320,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 320,
        behavior: 'smooth'
      });
    }
  };

  const renderStarRating = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-0.5">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <Star className="h-3 w-3 text-gray-300" />
            <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="h-3 w-3 text-gray-300" />
        ))}
        <span className="text-xs text-gray-600 ml-1">({rating.toFixed(1)})</span>
      </div>
    );
  };

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-purple-50 to-orange-50">
        <div className="container mx-auto px-4">
          {/* Header with Navigation Arrows Skeleton */}
          <div className="flex items-end justify-between mb-12">
            <div className="text-left">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black">
                Upcoming Events
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl">
                Join our exclusive events, workshops, and webinars designed to accelerate your professional growth
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gray-300 rounded-full animate-pulse"></div>
              <div className="h-10 w-10 bg-gray-300 rounded-full animate-pulse"></div>
            </div>
          </div>

          <div className="flex space-x-6 pb-6">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex-none w-80 animate-pulse">
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-[420px]">
                  <div className="bg-gray-300 h-56"></div>
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-gray-300 rounded"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                    <div className="flex justify-between mt-4">
                      <div className="h-4 bg-gray-300 rounded w-20"></div>
                      <div className="h-4 bg-gray-300 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-br from-purple-50 to-orange-50">
      <div className="container mx-auto px-4">
        {/* Header with Navigation Arrows */}
        <div className="flex items-end justify-between mb-12">
          <div className="text-left">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black">
              Upcoming Events
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl">
              Join our exclusive events, workshops, and webinars designed to accelerate your professional growth
            </p>
          </div>
          
          {/* Navigation Arrows */}
          <div className="flex items-center space-x-3">
            <Button
              onClick={scrollLeft}
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full border-gray-300 hover:border-purple-400 hover:bg-purple-50 transition-all duration-300 shadow-sm"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600 hover:text-purple-600" />
            </Button>
            <Button
              onClick={scrollRight}
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full border-gray-300 hover:border-orange-400 hover:bg-orange-50 transition-all duration-300 shadow-sm"
            >
              <ChevronRight className="h-5 w-5 text-gray-600 hover:text-orange-600" />
            </Button>
          </div>
        </div>

        {/* Horizontal Scrolling Container */}
        {events.length === 0 ? (
          <div className="text-center py-20 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 shadow-xl">
            <div className="relative inline-block mb-6">
              <div className="absolute -inset-4 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full blur-xl opacity-10"></div>
              <Calendar className="h-20 w-20 text-gray-400 mx-auto relative" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-3">No Upcoming Events</h3>
            <p className="text-gray-600 max-w-md mx-auto text-lg">
              Check back soon for new events and workshops.
            </p>
          </div>
        ) : (
          <div className="relative">
            <div 
              ref={scrollContainerRef}
              className="flex overflow-x-auto scrollbar-hide space-x-6 pb-6 snap-x snap-mandatory"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              {duplicatedEvents.map((event, index) => (
                <div 
                  key={`${event.id}-${index}`} 
                  className="flex-none w-80 snap-start"
                >
                  <Card className="group hover:shadow-2xl transition-all duration-500 bg-white/90 backdrop-blur-sm border-purple-100 hover:border-purple-300 overflow-hidden h-[420px] flex flex-col">
                    {/* Event Thumbnail with Icon */}
                    <div className="relative h-56 overflow-hidden bg-gradient-to-br from-purple-400 to-orange-400">
                      {event.image_url ? (
                        <img 
                          src={event.image_url} 
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-400 to-orange-400 flex items-center justify-center">
                          <Calendar className="h-14 w-14 text-white opacity-90" />
                        </div>
                      )}
                      
                      {/* Animated Orange Calendar Icon - Always Visible */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-orange-500/90 rounded-full p-4 shadow-lg animate-pulse-slow">
                          <Calendar className="h-6 w-6 text-white" />
                        </div>
                      </div>

                      {/* Hover Overlay */}
                      <Link 
                        to={`/events/${event.id}`}
                        className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-all duration-300"
                      >
                        <div className="bg-white rounded-full p-4 transform scale-110 group-hover:scale-100 transition-transform duration-300 shadow-xl">
                          <Calendar className="h-7 w-7 text-orange-600" />
                        </div>
                      </Link>

                      {/* Wishlist Button */}
                      <div className="absolute top-3 right-3 z-20">
                        <WishlistButton 
                          itemId={event.id}
                          itemType="event"
                          variant="ghost"
                          size="icon"
                          className="bg-white/90 hover:bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                        />
                      </div>

                      {/* Event Type Badge */}
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-white/95 text-purple-800 border-purple-200 text-xs font-medium backdrop-blur-sm">
                          {event.event_type?.charAt(0).toUpperCase() + event.event_type?.slice(1) || 'Event'}
                        </Badge>
                      </div>

                      {/* Price/Free Badge */}
                      <div className="absolute bottom-3 right-3">
                        {event.is_free ? (
                          <Badge className="bg-green-500 text-white border-0 text-xs font-bold shadow-lg">
                            Free
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-500 text-white border-0 text-xs font-bold shadow-lg">
                            <PriceDisplay amount={event.price} originalCurrency="USD" />
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Event Content */}
                    <div className="flex-1 p-5 flex flex-col">
                      <CardHeader className="p-0 pb-3">
                        <CardTitle className="text-base font-bold group-hover:text-purple-600 transition-colors duration-300 line-clamp-2 leading-tight">
                          {event.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 text-sm mt-2 text-gray-600 leading-relaxed">
                          {event.description}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="p-0 mt-auto space-y-3">
                        {/* Event Reviews */}
                        {event.reviews && event.reviews.total_reviews > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center text-gray-700 font-medium">
                              <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                              <span>{event.reviews.avg_rating?.toFixed(1) || 0}</span>
                              <span className="ml-1 text-gray-500">({event.reviews.total_reviews || 0})</span>
                            </div>
                            <div className="flex items-center text-gray-700 font-medium">
                              <Users className="h-4 w-4 mr-2 text-blue-500" />
                              <span>{event.total_attendees || 0} attending</span>
                            </div>
                          </div>
                        )}

                        {/* Event Date and Time */}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-gray-600 font-medium">
                            <Calendar className="h-4 w-4 mr-2 text-purple-500" />
                            {format(parseISO(event.start_time), 'MMM d, yyyy')}
                          </div>
                          <div className="flex items-center text-gray-600 font-medium">
                            <Clock className="h-4 w-4 mr-2 text-orange-500" />
                            {format(parseISO(event.start_time), 'h:mm a')}
                          </div>
                        </div>

                        {/* Location */}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-gray-700 font-medium">
                            <MapPin className="h-4 w-4 mr-2 text-red-500" />
                            <span className="truncate max-w-[180px]">
                              {event.online_meeting_link ? 'Online Event' : (event.location || 'Location TBA')}
                            </span>
                          </div>
                        </div>
                        
                        {/* View Event Button */}
                        <Link to={`/events/${event.id}`} className="block mt-3">
                          <Button className="w-full bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white border-0 text-sm font-semibold py-2 h-10 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5">
                            View Event Details
                          </Button>
                        </Link>
                      </CardContent>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="text-center mt-12">
          <Button 
            asChild 
            size="lg" 
            className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 rounded-xl px-8"
          >
            <Link to="/events" className="flex items-center gap-2">
              Explore All Events
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.9; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .snap-x {
          scroll-snap-type: x mandatory;
        }
        .snap-start {
          scroll-snap-align: start;
        }
      `}</style>
    </section>
  );
};

export default EventsSection;
