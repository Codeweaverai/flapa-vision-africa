
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Mic, Video, Calendar, BookOpen, MessageSquare, FileText, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { format } from 'date-fns';
import { fetchSpeakingAppearances, fetchSpeakingTopics, createSpeakingBooking } from '@/services/speakingService';

// Form schema
const speakingFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  organization: z.string().min(2, { message: 'Organization must be at least 2 characters.' }),
  eventType: z.string().min(1, { message: 'Please specify the type of event.' }),
  eventDate: z.string().refine((date) => {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate > today;
  }, { message: 'Event date must be in the future.' }),
  description: z.string().optional(),
});

type SpeakingFormValues = z.infer<typeof speakingFormSchema>;

const SpeakingPage = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch speaking topics and appearances
  const { data: topics = [], isLoading: isLoadingTopics } = useQuery({
    queryKey: ['speakingTopics'],
    queryFn: fetchSpeakingTopics,
  });

  const { data: appearances = [], isLoading: isLoadingAppearances } = useQuery({
    queryKey: ['speakingAppearances'],
    queryFn: fetchSpeakingAppearances,
  });

  // Form handling
  const form = useForm<SpeakingFormValues>({
    resolver: zodResolver(speakingFormSchema),
    defaultValues: {
      name: '',
      email: '',
      organization: '',
      eventType: '',
      eventDate: '',
      description: '',
    },
  });

  const onSubmit = async (values: SpeakingFormValues) => {
    setIsSubmitting(true);
    
    try {
      const result = await createSpeakingBooking({
        name: values.name,
        email: values.email,
        organization: values.organization,
        event_type: values.eventType,
        event_date: values.eventDate,
        description: values.description,
        user_id: user?.id || null,
      });
      
      if (result) {
        form.reset();
      }
    } catch (error) {
      console.error("Error submitting speaking request:", error);
      toast.error("Failed to submit your request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="section-container bg-light-purple py-16">
        <div className="mb-12 max-w-3xl mx-auto text-center">
          <h1 className="heading-lg mb-6 text-gradient">Speaking & Media</h1>
          <p className="text-lg">
            Mbolela Pule is a dynamic speaker on technology, entrepreneurship, 
            and African innovation. Book him for your next event or explore his 
            past appearances and media features.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-16">
          <div>
            <h2 className="heading-md mb-6 flex items-center gap-2">
              <Mic className="h-6 w-6 text-primary" />
              Speaking Topics
            </h2>
            <div className="space-y-6">
              {isLoadingTopics ? (
                <p>Loading topics...</p>
              ) : (
                topics.map((topic) => (
                  <Card key={topic.id}>
                    <CardHeader>
                      <CardTitle>{topic.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{topic.description}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
          
          <div>
            <h2 className="heading-md mb-6 flex items-center gap-2">
              <Video className="h-6 w-6 text-primary" />
              Recent Appearances
            </h2>
            <div className="space-y-6">
              {isLoadingAppearances ? (
                <p>Loading appearances...</p>
              ) : (
                appearances.map((appearance) => (
                  <div key={appearance.id} className="bg-card rounded-lg overflow-hidden shadow">
                    <img 
                      src={appearance.image_url || "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b"} 
                      alt={appearance.title} 
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg">{appearance.event_name}</h3>
                        <Badge>{appearance.appearance_type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {format(new Date(appearance.event_date), 'MMMM d, yyyy')} • {appearance.location}
                      </p>
                      <p className="mb-4">{appearance.title} - {appearance.description}</p>
                      {appearance.media_link && (
                        <Button variant="outline" size="sm" className="w-full" asChild>
                          <a href={appearance.media_link} target="_blank" rel="noopener noreferrer">
                            {appearance.appearance_type === 'Keynote' || appearance.appearance_type === 'Panel' ? (
                              <><Video className="h-4 w-4 mr-2" /> Watch Recording</>
                            ) : (
                              <><FileText className="h-4 w-4 mr-2" /> View Summary</>
                            )}
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-8 shadow-lg">
          <h2 className="heading-md mb-6 text-center">Book Mbolela for Your Event</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">Speaking Formats</h3>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-primary" />
                  <span>Keynote Presentations (30-60 minutes)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span>Panel Discussions & Fireside Chats</span>
                </li>
                <li className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span>Workshops & Training Sessions (2-4 hours)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  <span>Virtual Events & Webinars</span>
                </li>
              </ul>

              <h3 className="text-xl font-semibold mb-4">Upcoming Availability</h3>
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>June 2025: Europe & Middle East</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>August 2025: West Africa</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>October 2025: North America</span>
                </div>
              </div>
            </div>
            
            <div>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Full Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="organization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization</FormLabel>
                        <FormControl>
                          <Input placeholder="Company or Event Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="eventType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Type</FormLabel>
                        <FormControl>
                          <Input placeholder="Conference, Workshop, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="eventDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Details</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Please provide any additional details about the event, expected audience, etc."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormDescription className="text-sm">
                    By submitting this form, you understand that this is a preliminary inquiry and doesn't guarantee availability.
                    You will receive a response within 48 hours.
                  </FormDescription>
                  
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Submitting..." : "Submit Speaking Request"}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SpeakingPage;
