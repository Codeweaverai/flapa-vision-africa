import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, MapPin, Users, ArrowRight, Star, ChevronLeft, ChevronRight, DollarSign, Zap } from 'lucide-react';
import { Event, fetchEvents } from '@/services/eventService';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import PriceDisplay from '@/components/currency/PriceDisplay';
import { supabase } from '@/lib/supabaseClient';
import WishlistButton from '@/components/wishlist/WishlistButton';

interface EventWithReviews extends Event {
  reviews?: {
    avg_rating: number;
    total_reviews: number;
  };
  total_attendees?: number;
  creator_name?: string;
  creator_avatar?: string;
  event_tickets?: Array<{
    id: string;
    name: string;
    price: number;
    quantity_available: number;
    quantity_sold: number;
  }>;
}

const LiveEventsSection = () => {
  const [events, setEvents] = useState<EventWithReviews[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const eventsData = await fetchEvents();
      
      // Fetch reviews, bookings, and creator profiles for all events
      const eventsWithDetails = await Promise.all(
        eventsData.map(async (event) => {
          const [reviewsResult, bookingsResult, profilesResult] = await Promise.allSettled([
            // Fetch reviews
            supabase
              .from('event_reviews')
              .select('rating')
              .eq('event_id', event.id),
            // Fetch bookings for attendee count
            supabase
              .from('event_bookings')
              .select('id')
              .eq('event_id', event.id),
            // Fetch creator profile
            supabase
              .from('profiles')
              .select('username, full_name, avatar_url')
              .eq('id', event.creator_id)
              .single()
          ]);

          const reviews = reviewsResult.status === 'fulfilled' && !reviewsResult.value.error ? 
            reviewsResult.value.data : [];
          const bookings = bookingsResult.status === 'fulfilled' && !bookingsResult.value.error ? 
            bookingsResult.value.data : [];
          const profile = profilesResult.status === 'fulfilled' && !profilesResult.value.error ? 
            profilesResult.value.data : null;

          // Fetch tickets
          const { data: tickets } = await supabase
            .from('event_tickets')
            .select('id, name, price, quantity_available, quantity_sold, event_id')
            .eq('event_id', event.id);

          const totalReviews = reviews?.length || 0;
          const avgRating = totalReviews > 0 
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
            : 0;

          const is_free = !tickets || tickets.length === 0 || Math.min(...tickets.map(t => t.price)) === 0;

          return {
            ...event,
            reviews: {
              avg_rating: avgRating,
              total_reviews: totalReviews
            },
            total_attendees: bookings.length,
            creator_name: profile?.full_name || profile?.username || 'Unknown Creator',
            creator_avatar: profile?.avatar_url || null,
            event_tickets: tickets || [],
            is_free
          };
        })
      );

      // Filter for live events only (events happening now)
      const now = new Date();
      const liveEvents = eventsWithDetails
        .filter(event => {
          const startTime = parseISO(event.start_time);
          const endTime = parseISO(event.end_time);
          return isAfter(now, startTime) && isBefore(now, endTime);
        })
        .slice(0, 12); // Show 12 events for horizontal scrolling
      
      setEvents(liveEvents);
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

  const getMinPrice = (tickets: EventWithReviews['event_tickets']) => {
    if (!tickets || tickets.length === 0) return 0;
    return Math.min(...tickets.map(t => t.price));
  };

  const getTotalCapacity = (tickets: EventWithReviews['event_tickets']) => {
    if (!tickets || tickets.length === 0) return 0;
    return tickets.reduce((sum, ticket) => sum + ticket.quantity_available, 0);
  };

  const getSoldTickets = (tickets: EventWithReviews['event_tickets']) => {
    if (!tickets || tickets.length === 0) return 0;
    return tickets.reduce((sum, ticket) => sum + ticket.quantity_sold, 0);
  };

  const renderStarRating = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400 drop-shadow-sm" />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <Star className="h-4 w-4 text-gray-300" />
            <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
        ))}
        <span className="text-sm text-gray-600 ml-1 font-medium">({rating.toFixed(1)})</span>
      </div>
    );
  };

  // Live Now Badge with Red Pulse Animation
  const LiveBadge = () => (
    <Badge className="bg-gradient-to-r from-red-500 to-pink-600 text-white border-0 shadow-lg animate-pulse">
      <Zap className="h-3 w-3 mr-1" />
      Live Now
    </Badge>
  );

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-red-50 to-pink-50">
        <div className="container mx-auto px-4">
          {/* Header with Navigation Arrows Skeleton */}
          <div className="flex items-end justify-between mb-12">
            <div className="text-left">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black">
                Live Events
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl">
                Join events happening right now! Don't miss out on real-time experiences and interactions.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gray-300 rounded-full animate-pulse"></div>
              <div className="h-10 w-10 bg-gray-300 rounded-full animate-pulse"></div>
            </div>
          </div>

          <div className="flex space-x-6 pb-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="flex-none w-80 animate-pulse">
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-[480px]">
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
    <section className="py-16 bg-gradient-to-br from-red-50 to-pink-50">
      <div className="container mx-auto px-4">
        {/* Header with Navigation Arrows */}
        <div className="flex items-end justify-between mb-12">
          <div className="text-left">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-black">
              Live Events
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl">
              Join events happening right now! Don't miss out on real-time experiences and interactions.
            </p>
          </div>
          
          {/* Navigation Arrows */}
          <div className="flex items-center space-x-3">
            <Button
              onClick={scrollLeft}
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full border-gray-300 hover:border-red-400 hover:bg-red-50 transition-all duration-300 shadow-sm"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600 hover:text-red-600" />
            </Button>
            <Button
              onClick={scrollRight}
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full border-gray-300 hover:border-pink-400 hover:bg-pink-50 transition-all duration-300 shadow-sm"
            >
              <ChevronRight className="h-5 w-5 text-gray-600 hover:text-pink-600" />
            </Button>
          </div>
        </div>

        {/* Horizontal Scrolling Container */}
        {events.length === 0 ? (
          <div className="text-center py-20 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/30 shadow-xl">
            <div className="relative inline-block mb-6">
              <div className="absolute -inset-4 bg-gradient-to-r from-red-500 to-pink-600 rounded-full blur-xl opacity-10"></div>
              <Zap className="h-20 w-20 text-gray-400 mx-auto relative" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-3">No Live Events</h3>
            <p className="text-gray-600 max-w-md mx-auto text-lg">
              There are no events happening right now. Check back later or browse upcoming events.
            </p>
            <Button 
              asChild
              className="mt-6 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-8 py-3"
            >
              <Link to="/events">
                Browse All Events
              </Link>
            </Button>
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
                  <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-500 bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:scale-[1.02]">
                    <div className="relative">
                      {/* Event Image */}
                      <div className="relative h-56 overflow-hidden cursor-pointer">
                        {event.image_url ? (
                          <img
                            src={event.image_url}
                            alt={event.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-red-200 via-pink-200 to-rose-300 flex items-center justify-center group-hover:from-red-300 group-hover:to-pink-300 transition-all duration-500">
                            {/* Animated Event Icon - Always Visible */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-full p-4 shadow-lg animate-pulse-slow">
                                <Zap className="h-8 w-8 text-white" />
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        {/* Status and Type Badges */}
                        <div className="absolute top-4 left-4 right-4 flex justify-between">
                          <LiveBadge />
                          <Badge className="bg-white/90 text-gray-700 border-white/50 backdrop-blur-sm font-medium">
                            {event.event_type}
                          </Badge>
                        </div>

                        {/* Event Date Overlay */}
                        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border border-white/30">
                          <div className="text-sm font-bold text-gray-900">
                            Live Now
                          </div>
                        </div>

                        {/* Wishlist Button - Moved to Bottom Right */}
                        <div className="absolute bottom-4 right-4 z-20">
                          <WishlistButton 
                            itemId={event.id}
                            itemType="event"
                            variant="ghost"
                            size="icon"
                            iconOnly
                            className="bg-white/90 hover:bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all hover:scale-110 border-0 hover:text-red-500"
                          />
                        </div>

                        {/* Live Pulse Animation Overlay */}
                        <div className="absolute inset-0 border-2 border-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
                      </div>

                      {/* Card Content */}
                      <div className="cursor-pointer">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-xl font-bold text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors duration-300">
                            {event.title}
                          </CardTitle>
                          
                          {/* Creator with Avatar */}
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Avatar className="h-6 w-6 border border-red-200">
                              <AvatarImage 
                                src={event.creator_avatar || undefined} 
                                alt={event.creator_name}
                              />
                              <AvatarFallback className="bg-gradient-to-r from-red-400 to-pink-500 text-white text-xs font-bold">
                                {event.creator_name?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">by {event.creator_name}</span>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          {/* Event Reviews */}
                          {event.reviews && event.reviews.total_reviews > 0 && (
                            <div className="flex items-center justify-between">
                              {renderStarRating(event.reviews.avg_rating)}
                              <span className="text-xs text-gray-500 font-medium">
                                {event.reviews.total_reviews} review{event.reviews.total_reviews !== 1 ? 's' : ''}
                              </span>
                            </div>
                          )}

                          {/* Event Details */}
                          {event.location && (
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="h-4 w-4 mr-2 text-red-500 flex-shrink-0" />
                              <span className="truncate font-medium">{event.location}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center text-sm text-gray-600">
                            <Users className="h-4 w-4 mr-2 text-red-500 flex-shrink-0" />
                            <span className="font-medium">{getSoldTickets(event.event_tickets)}/{getTotalCapacity(event.event_tickets)} watching</span>
                          </div>

                          {/* Event Time */}
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="h-4 w-4 mr-2 text-red-500 flex-shrink-0" />
                            <span className="font-medium">Ends {format(parseISO(event.end_time), 'h:mm a')}</span>
                          </div>
                        </CardContent>

                        <CardContent className="flex justify-between items-center pt-4 border-t border-gray-100">
                          <div className="flex items-center">
                            <DollarSign className="h-5 w-5 mr-1 text-red-500" />
                            <span className="font-bold text-xl text-gray-900">
                              {event.is_free ? (
                                <span className="bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                                  Free
                                </span>
                              ) : (
                                <PriceDisplay amount={getMinPrice(event.event_tickets)} originalCurrency="USD" />
                              )}
                            </span>
                            {!event.is_free && event.event_tickets && event.event_tickets.length > 1 && (
                              <span className="text-sm text-gray-500 ml-1 font-medium">+</span>
                            )}
                          </div>
                          <Button 
                            size="sm" 
                            className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 font-semibold"
                            asChild
                          >
                            <Link to={`/events/${event.id}`}>
                              Join Now
                            </Link>
                          </Button>
                        </CardContent>
                      </div>
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
            className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 rounded-xl px-8"
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

export default LiveEventsSection;
