
import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { CalendarClock, Clock, MessageSquare, User, Users, Video, Briefcase, FileText, Check, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { createConsultationBooking } from '@/services/consultationService';
import { toast } from 'sonner';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, addMinutes, addDays, parse, isAfter, isBefore, startOfToday, addHours, setHours, setMinutes } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const ConsultPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State for booking form
  const [consultationType, setConsultationType] = useState('discovery');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  const [timeZone, setTimeZone] = useState('Africa/Johannesburg');
  const [topic, setTopic] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [notes, setNotes] = useState('');
  const [preferredDates, setPreferredDates] = useState('');
  const [preferredTimes, setPreferredTimes] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get consultation details based on type
  const getConsultationDetails = () => {
    switch (consultationType) {
      case 'discovery':
        return { title: 'Discovery Call', duration: 30, price: 99 };
      case 'strategy':
        return { title: 'Strategy Session', duration: 60, price: 199 };
      case 'executive':
        return { title: 'Executive Team Session', duration: 90, price: 499 };
      default:
        return { title: 'Discovery Call', duration: 30, price: 99 };
    }
  };

  // Generate available time slots
  const getAvailableTimeSlots = () => {
    const slots = [];
    // Business hours from 9 AM to 5 PM
    for (let hour = 9; hour <= 16; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        // Skip 12:30 PM to 1:30 PM for lunch
        if ((hour === 12 && minute === 30) || (hour === 13 && minute === 0)) continue;
        
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const timeSlots = getAvailableTimeSlots();

  // Handle form submission
  const handleRequestBooking = async () => {
    if (!user) {
      toast.error("Please sign in to book a consultation");
      return;
    }

    if (!selectedDate || !selectedTime || !agreedToTerms) {
      toast.error("Please fill in all required fields and agree to the terms");
      return;
    }

    setIsSubmitting(true);

    try {
      const consultationDetails = getConsultationDetails();
      
      // Parse the selected time
      const [hours, minutes] = selectedTime.split(':').map(Number);
      
      // Create Date objects for start and end times
      const scheduledTime = new Date(selectedDate);
      scheduledTime.setHours(hours, minutes, 0, 0);
      
      const endTime = addMinutes(scheduledTime, consultationDetails.duration);
      
      const bookingData = {
        booking_type: 'google_meet',
        duration: consultationDetails.duration,
        scheduled_time: scheduledTime,
        topic: topic || consultationDetails.title,
        notes: notes || `Business type: ${businessType}`,
      };

      const result = await createConsultationBooking(
        bookingData, 
        user, 
        consultationDetails.price
      );

      if (result) {
        toast.success("Booking request submitted! You'll be redirected to complete payment.");
      } else {
        toast.error("There was an issue with your booking request");
      }
    } catch (error) {
      console.error('Error during booking:', error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle inquiry form submission
  const handleInquirySubmission = async () => {
    if (!user) {
      toast.error("Please sign in to submit an inquiry");
      return;
    }

    if (!topic || !businessType || !notes) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      toast.success("Your inquiry has been submitted! We'll contact you soon to schedule your consultation.");
      // In a real app, you might send this data to your backend
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="section-container">
        <div className="mb-12 max-w-3xl mx-auto text-center">
          <h1 className="heading-lg mb-6 text-gradient">Book a Consultation</h1>
          <p className="text-lg">
            Schedule a one-on-one consultation with Mbolela Pule to discuss your business 
            challenges, growth strategies, or technology implementation questions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Discovery Call
              </CardTitle>
              <CardDescription>30 Minutes</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="text-3xl font-bold mb-4">$99</div>
              <p className="mb-6">
                A brief introductory session to discuss your business and determine 
                how Mbolela can best support your goals.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Assessment of your current situation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Identification of key challenges</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Recommendations for next steps</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => {
                  setConsultationType('discovery');
                  document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <CalendarClock className="h-4 w-4 mr-2" /> Book Discovery Call
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="flex flex-col border-primary">
            <div className="bg-primary text-primary-foreground text-center py-2 text-sm font-medium">
              Most Popular
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Strategy Session
              </CardTitle>
              <CardDescription>60 Minutes</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="text-3xl font-bold mb-4">$199</div>
              <p className="mb-6">
                An in-depth consultation focused on developing actionable strategies 
                for your specific business challenges.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Deep dive into your business model</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Tailored strategic recommendations</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Action plan development</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>30-day email follow-up support</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full"
                onClick={() => {
                  setConsultationType('strategy');
                  document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <CalendarClock className="h-4 w-4 mr-2" /> Book Strategy Session
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Executive Team Session
              </CardTitle>
              <CardDescription>90 Minutes</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="text-3xl font-bold mb-4">$499</div>
              <p className="mb-6">
                A collaborative session with your leadership team to align vision, 
                address challenges, and develop strategic initiatives.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Facilitated team discussion</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Strategic alignment workshop</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Prioritization of initiatives</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>Written summary and recommendations</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span>60-day email follow-up support</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full"
                onClick={() => {
                  setConsultationType('executive');
                  document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <CalendarClock className="h-4 w-4 mr-2" /> Book Team Session
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="heading-md mb-6">How It Works</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-full flex items-center justify-center min-w-12 h-12">
                  <CalendarClock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">1. Select a Consultation Package</h3>
                  <p>
                    Choose the consultation option that best fits your needs and schedule 
                    a time that works for you using our online booking system.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-full flex items-center justify-center min-w-12 h-12">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">2. Complete Pre-Consultation Form</h3>
                  <p>
                    Fill out a brief questionnaire to help Mbolela understand your business, 
                    challenges, and what you'd like to achieve during the consultation.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-full flex items-center justify-center min-w-12 h-12">
                  <Video className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">3. Attend Your Consultation</h3>
                  <p>
                    Join the meeting via video call at your scheduled time. Come prepared 
                    with questions and be ready to discuss your business in detail.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-full flex items-center justify-center min-w-12 h-12">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">4. Receive Personalized Action Plan</h3>
                  <p>
                    Following your session, you'll receive a detailed summary with actionable 
                    recommendations and next steps to implement in your business.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div id="booking-section" className="bg-card p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6">Book Your Consultation</h2>
            
            {!user ? (
              <div className="text-center p-6 bg-muted rounded-lg">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Account Required</h3>
                <p className="mb-6">
                  Please sign in or create an account to book a consultation with Mbolela Pule.
                </p>
                <Button asChild size="lg">
                  <Link to="/auth">Sign In or Register</Link>
                </Button>
              </div>
            ) : (
              <Tabs defaultValue="calendar">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="calendar">Calendar</TabsTrigger>
                  <TabsTrigger value="inquiry">Contact Form</TabsTrigger>
                </TabsList>
                
                <TabsContent value="calendar">
                  <div className="bg-muted p-4 rounded-lg mb-6 text-center">
                    <CalendarClock className="h-8 w-8 mx-auto text-primary mb-2" />
                    <p>Select a date and time to schedule your consultation.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="consultation-type">Consultation Type</Label>
                      <select 
                        id="consultation-type" 
                        value={consultationType}
                        onChange={(e) => setConsultationType(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="discovery">Discovery Call (30 min) - $99</option>
                        <option value="strategy">Strategy Session (60 min) - $199</option>
                        <option value="executive">Executive Team Session (90 min) - $499</option>
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !selectedDate && "text-muted-foreground"
                              )}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={selectedDate}
                              onSelect={setSelectedDate}
                              disabled={(date) => 
                                isBefore(date, startOfToday()) || 
                                isAfter(date, addDays(new Date(), 90))
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div>
                        <Label htmlFor="time">Preferred Time</Label>
                        <select
                          id="time"
                          value={selectedTime}
                          onChange={(e) => setSelectedTime(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={!selectedDate}
                        >
                          <option value="">Select a time</option>
                          {timeSlots.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="time-zone">Time Zone</Label>
                      <select 
                        id="time-zone" 
                        value={timeZone}
                        onChange={(e) => setTimeZone(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="Africa/Johannesburg">Africa/Johannesburg (CAT)</option>
                        <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                        <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                        <option value="Europe/London">Europe/London (GMT)</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="topic">Consultation Topic (Optional)</Label>
                      <Input 
                        id="topic" 
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="What would you like to discuss?" 
                      />
                    </div>
                    
                    <div className="flex items-start space-x-2 pt-2">
                      <Checkbox 
                        id="terms" 
                        checked={agreedToTerms}
                        onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                      />
                      <Label htmlFor="terms" className="text-sm">
                        I understand that I will receive a payment link after submitting this form, and my booking will be confirmed after payment.
                      </Label>
                    </div>
                    
                    <Button 
                      type="button" 
                      className="w-full"
                      disabled={isSubmitting || !selectedDate || !selectedTime || !agreedToTerms}
                      onClick={handleRequestBooking}
                    >
                      <CalendarClock className="h-4 w-4 mr-2" /> 
                      {isSubmitting ? "Processing..." : "Request Booking"}
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="inquiry">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="topic-inquiry">Consultation Topic</Label>
                      <Input 
                        id="topic-inquiry" 
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="What would you like to discuss?" 
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="business-type">Business Type</Label>
                      <Input 
                        id="business-type" 
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        placeholder="Industry & company size" 
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="message">Your Message</Label>
                      <textarea
                        id="message"
                        rows={4}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Please provide details about what you'd like to discuss during the consultation"
                      ></textarea>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="preferred-dates">Preferred Dates</Label>
                        <Input 
                          id="preferred-dates" 
                          value={preferredDates}
                          onChange={(e) => setPreferredDates(e.target.value)}
                          placeholder="e.g., Jun 15-20" 
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="preferred-times">Preferred Times</Label>
                        <Input 
                          id="preferred-times" 
                          value={preferredTimes}
                          onChange={(e) => setPreferredTimes(e.target.value)}
                          placeholder="e.g., 2-5 PM CAT" 
                        />
                      </div>
                    </div>
                    
                    <Button 
                      type="button" 
                      className="w-full"
                      disabled={isSubmitting || !topic || !businessType || !notes}
                      onClick={handleInquirySubmission}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" /> 
                      {isSubmitting ? "Processing..." : "Submit Inquiry"}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
        
        <div className="bg-muted rounded-lg p-8">
          <h2 className="heading-md mb-8 text-center">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">What should I prepare before the consultation?</h3>
              <p>
                To make the most of your session, prepare a concise overview of your business, 
                clearly define the challenges you're facing, and think about specific questions 
                you'd like answered during the call.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">What happens if I need to reschedule?</h3>
              <p>
                You can reschedule your appointment up to 24 hours before your scheduled time at no charge. 
                Cancellations within 24 hours may be subject to a rebooking fee.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">Do you offer ongoing consulting arrangements?</h3>
              <p>
                Yes, for clients who require ongoing support, we offer retainer packages with preferred rates 
                and priority scheduling. Please contact us directly to discuss these options.
              </p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">How are consultations conducted?</h3>
              <p>
                Consultations are typically conducted via Google Meet. You'll receive a 
                calendar invitation with connection details after booking. For executive team sessions, 
                we can also arrange in-person consultations in select cities for an additional fee.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ConsultPage;
