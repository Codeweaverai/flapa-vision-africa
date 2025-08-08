import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import EventReviewsTab from '@/components/event/EventReviewsTab';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Ticket,
  Share2,
  Heart,
  ArrowLeft,
  CheckCircle,
  Info,
  CalendarPlus,
  MessageCircle,
  Facebook,
  Instagram,
  Linkedin,
  MessageSquare,
  ExternalLink,
  Twitter,
  ArrowRight,
  HelpCircle,
  Circle
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import PriceDisplay from '@/components/currency/PriceDisplay';
import { CurrencyCode } from '@/constants/currencies';

// ... (keep all your existing interfaces)

const EventDetailPage = () => {
  // ... (keep all your existing state and hooks)

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate('/events')}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content (keep everything exactly the same) */}
            <div className="lg:col-span-2 space-y-6">
              {/* ... (all your existing main content remains unchanged) ... */}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Registration Card (unchanged) */}
              <Card className="shadow-lg">
                {/* ... (existing ticket purchasing content) ... */}
              </Card>

              {/* Event Stats Card (unchanged) */}
              <Card className="shadow-lg">
                {/* ... (existing stats content) ... */}
              </Card>

              {/* Creator Profile Card (unchanged) */}
              {creator && (
                <Card className="shadow-lg">
                  {/* ... (existing creator profile content) ... */}
                </Card>
              )}

              {/* NEW FAQ Card */}
              <Card className="shadow-lg border-0 bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-purple-600">
                    <HelpCircle className="h-5 w-5" />
                    Event FAQs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Accordion type="single" collapsible>
                    <AccordionItem 
                      value="item-1" 
                      className="border border-orange-100 rounded-lg overflow-hidden mb-3 bg-white"
                    >
                      <AccordionTrigger className="px-4 py-3 hover:bg-orange-50 transition-colors font-medium text-gray-800">
                        <div className="flex items-center gap-2">
                          <Circle className="h-3 w-3 text-orange-500" />
                          What should I bring to the event?
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 py-3 bg-gradient-to-r from-orange-50 to-purple-50 text-gray-700">
                        Please bring your ticket (digital or printed), a valid ID, and any materials specified in your confirmation email. 
                        For tech events, we recommend bringing your laptop.
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem 
                      value="item-2" 
                      className="border border-orange-100 rounded-lg overflow-hidden mb-3 bg-white"
                    >
                      <AccordionTrigger className="px-4 py-3 hover:bg-orange-50 transition-colors font-medium text-gray-800">
                        <div className="flex items-center gap-2">
                          <Circle className="h-3 w-3 text-purple-500" />
                          Is there parking available?
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 py-3 bg-gradient-to-r from-orange-50 to-purple-50 text-gray-700">
                        Yes! We have complimentary parking in the venue garage. Enter from 3rd Street. 
                        Additional paid parking is available across the street at the City Center Garage.
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem 
                      value="item-3" 
                      className="border border-orange-100 rounded-lg overflow-hidden mb-3 bg-white"
                    >
                      <AccordionTrigger className="px-4 py-3 hover:bg-orange-50 transition-colors font-medium text-gray-800">
                        <div className="flex items-center gap-2">
                          <Circle className="h-3 w-3 text-pink-500" />
                          What's the refund policy?
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 py-3 bg-gradient-to-r from-orange-50 to-purple-50 text-gray-700">
                        Full refunds available up to 7 days before the event. 50% refund between 7-2 days before. 
                        No refunds within 48 hours of the event start time.
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem 
                      value="item-4" 
                      className="border border-orange-100 rounded-lg overflow-hidden bg-white"
                    >
                      <AccordionTrigger className="px-4 py-3 hover:bg-orange-50 transition-colors font-medium text-gray-800">
                        <div className="flex items-center gap-2">
                          <Circle className="h-3 w-3 text-amber-500" />
                          Will food be provided?
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 py-3 bg-gradient-to-r from-orange-50 to-purple-50 text-gray-700">
                        Light refreshments will be served during breaks. For full-day events, lunch is included. 
                        Please notify us of any dietary restrictions in your account settings.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  <Button 
                    className="w-full mt-4 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
                    onClick={() => navigate('/contact')}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contact Event Support
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EventDetailPage;
