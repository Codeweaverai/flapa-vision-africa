import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, Clock, MapPin, VideoIcon, Users } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, addDays, setHours, setMinutes, isBefore } from 'date-fns';
import { toast } from 'sonner';
import { createConsultationBooking, fetchMobileOperators } from '@/services/consultationService';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MobileOperator } from '@/services/eventService';

const ConsultPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookingType, setBookingType] = useState<'google_meet' | 'in_person'>('google_meet');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined);
  const [duration, setDuration] = useState<number>(60);
  const [location, setLocation] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [mobileOperator, setMobileOperator] = useState<string>('MTN_MOMO_ZMB');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileOperators, setMobileOperators] = useState<MobileOperator[]>([]);

  // Pricing information
  const priceMap = {
    30: 500, // 30 minute session - 500 ZMW
    60: 900, // 60 minute session - 900 ZMW
    90: 1300, // 90 minute session - 1300 ZMW
  };

  // Available times - hardcoded for simplicity
  const availableTimes = [
    '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'
  ];

  // Fetch mobile operators on component mount
  useState(() => {
    const loadMobileOperators = async () => {
      const operators = await fetchMobileOperators();
      if (operators.length > 0) {
        setMobileOperators(operators);
      }
    };
    
    loadMobileOperators();
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please sign in to book a consultation");
      navigate("/auth");
      return;
    }
    
    if (!selectedDate || !selectedTime) {
      toast.error("Please select both a date and time");
      return;
    }

    if (!phoneNumber) {
      toast.error("Please provide a phone number for payment processing");
      return;
    }

    // Create a datetime by combining the date and time
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const scheduledTime = new Date(selectedDate);
    scheduledTime.setHours(hours, minutes, 0, 0);
    
    setIsSubmitting(true);
    
    try {
      const price = priceMap[duration as keyof typeof priceMap] || 900;
      
      const result = await createConsultationBooking(
        {
          booking_type: bookingType,
          duration,
          scheduled_time: scheduledTime,
          location: bookingType === 'in_person' ? location : undefined,
          topic,
          notes,
          phone_number: phoneNumber,
          mobile_operator: mobileOperator
        },
        user,
        price
      );
      
      if (result) {
        toast.success("Booking created! You'll be redirected to complete payment.");
        // Note: createConsultationBooking will handle the redirect for payment
      }
      
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter available dates (no past dates or weekends)
  const isDateUnavailable = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Disable past dates, weekends, and dates more than 60 days in the future
    const isPastDate = isBefore(date, today);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const isTooFarInFuture = isBefore(addDays(today, 60), date);
    
    return isPastDate || isWeekend || isTooFarInFuture;
  };

  return (
    <Layout>
      <div className="section-container bg-light-purple">
        <h1 className="heading-lg mb-8 text-gradient">Book a Consultation</h1>
        
        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Schedule Your Consultation</CardTitle>
                <CardDescription>
                  Fill out the form below to book a one-on-one session with Mbolela Pule
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <Label>Consultation Type</Label>
                    <RadioGroup 
                      defaultValue="google_meet" 
                      className="grid grid-cols-2 gap-4"
                      value={bookingType}
                      onValueChange={(value) => setBookingType(value as 'google_meet' | 'in_person')}
                    >
                      <div>
                        <RadioGroupItem value="google_meet" id="google_meet" className="peer sr-only" />
                        <Label
                          htmlFor="google_meet"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white p-4 hover:bg-gray-50 hover:border-primary [&:has([data-state=checked])]:border-primary peer-data-[state=checked]:border-primary"
                        >
                          <VideoIcon className="h-6 w-6 mb-2 text-primary" />
                          <div className="text-center">
                            <div className="font-medium">Google Meet</div>
                            <div className="text-sm text-muted-foreground">Online video call</div>
                          </div>
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem value="in_person" id="in_person" className="peer sr-only" />
                        <Label
                          htmlFor="in_person"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white p-4 hover:bg-gray-50 hover:border-primary [&:has([data-state=checked])]:border-primary peer-data-[state=checked]:border-primary"
                        >
                          <MapPin className="h-6 w-6 mb-2 text-primary" />
                          <div className="text-center">
                            <div className="font-medium">In Person</div>
                            <div className="text-sm text-muted-foreground">Face to face meeting</div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {bookingType === 'in_person' && (
                    <div className="space-y-2">
                      <Label htmlFor="location">Meeting Location</Label>
                      <Input 
                        id="location" 
                        placeholder="e.g., FlapaBay Office, Lusaka" 
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        required={bookingType === 'in_person'}
                      />
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <Label>Session Duration</Label>
                    <RadioGroup 
                      defaultValue="60" 
                      className="grid grid-cols-3 gap-4"
                      value={duration.toString()}
                      onValueChange={(value) => setDuration(parseInt(value))}
                    >
                      <div>
                        <RadioGroupItem value="30" id="duration_30" className="peer sr-only" />
                        <Label
                          htmlFor="duration_30"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white p-4 hover:bg-gray-50 [&:has([data-state=checked])]:border-primary peer-data-[state=checked]:border-primary"
                        >
                          <Clock className="h-6 w-6 mb-2 text-primary" />
                          <div className="text-center">
                            <div className="font-medium">30 min</div>
                            <div className="text-xs text-muted-foreground">Quick consultation</div>
                            <div className="mt-1 font-medium text-sm">K500</div>
                          </div>
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem value="60" id="duration_60" className="peer sr-only" />
                        <Label
                          htmlFor="duration_60"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white p-4 hover:bg-gray-50 [&:has([data-state=checked])]:border-primary peer-data-[state=checked]:border-primary"
                        >
                          <Clock className="h-6 w-6 mb-2 text-primary" />
                          <div className="text-center">
                            <div className="font-medium">60 min</div>
                            <div className="text-xs text-muted-foreground">Standard session</div>
                            <div className="mt-1 font-medium text-sm">K900</div>
                          </div>
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem value="90" id="duration_90" className="peer sr-only" />
                        <Label
                          htmlFor="duration_90"
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white p-4 hover:bg-gray-50 [&:has([data-state=checked])]:border-primary peer-data-[state=checked]:border-primary"
                        >
                          <Users className="h-6 w-6 mb-2 text-primary" />
                          <div className="text-center">
                            <div className="font-medium">90 min</div>
                            <div className="text-xs text-muted-foreground">Extended consultation</div>
                            <div className="mt-1 font-medium text-sm">K1,300</div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !selectedDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? format(selectedDate, "PPP") : "Select a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            disabled={isDateUnavailable}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Select
                        value={selectedTime}
                        onValueChange={setSelectedTime}
                        disabled={!selectedDate}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a time" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTimes.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="topic">Consultation Topic</Label>
                    <Input 
                      id="topic" 
                      placeholder="e.g., Business Strategy, Technical Advice" 
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea 
                      id="notes" 
                      placeholder="Any specific questions or topics you'd like to discuss?"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="min-h-24"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Mobile Money Number</Label>
                    <Input 
                      id="phone" 
                      placeholder="e.g., 26097XXXXXXX" 
                      value={phoneNumber} 
                      onChange={(e) => setPhoneNumber(e.target.value)} 
                      required
                    />
                    <p className="text-xs text-muted-foreground">Required for payment processing</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="operator">Mobile Operator</Label>
                    <Select value={mobileOperator} onValueChange={setMobileOperator}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select operator" />
                      </SelectTrigger>
                      <SelectContent>
                        {mobileOperators.length > 0 ? (
                          mobileOperators.map(op => (
                            <SelectItem key={op.code} value={op.code}>
                              {op.name} ({op.country})
                            </SelectItem>
                          ))
                        ) : (
                          <>
                            <SelectItem value="MTN_MOMO_ZMB">MTN Mobile Money (Zambia)</SelectItem>
                            <SelectItem value="AIRTEL_MONEY_ZMB">Airtel Money (Zambia)</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting || !selectedDate || !selectedTime || !phoneNumber}
                  >
                    {isSubmitting ? 'Processing...' : 'Book Consultation'}
                  </Button>
                  
                  {!user && (
                    <div className="text-center text-sm text-muted-foreground mt-2">
                      <p>You need to <Link to="/auth" className="font-medium text-primary hover:underline">sign in</Link> to book a consultation</p>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Consultation Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="font-medium">Types of Consultations</h3>
                  
                  <div className="bg-white/80 p-4 rounded-lg shadow-sm mb-4">
                    <VideoIcon className="h-6 w-6 text-primary mb-2" />
                    <h4 className="font-bold mb-1">Google Meet Sessions</h4>
                    <p className="text-sm text-muted-foreground">
                      Virtual consultations from anywhere in the world. You'll receive a meeting link after booking.
                    </p>
                  </div>
                  
                  <div className="bg-white/80 p-4 rounded-lg shadow-sm">
                    <MapPin className="h-6 w-6 text-primary mb-2" />
                    <h4 className="font-bold mb-1">In-Person Meetings</h4>
                    <p className="text-sm text-muted-foreground">
                      Face-to-face sessions at our office in Lusaka or other arranged locations.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Areas of Expertise</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-primary mr-2"></div>
                      <span>Technical innovation and strategy</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-primary mr-2"></div>
                      <span>Financial expertise and modeling</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-primary mr-2"></div>
                      <span>Travel and tourism innovation</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-primary mr-2"></div>
                      <span>Entrepreneurship and leadership</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-primary mr-2"></div>
                      <span>Social impact and community development</span>
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Payment Information</h3>
                  <p className="text-sm">
                    All consultations are paid via mobile money. You'll be redirected to complete payment after booking.
                  </p>
                  
                  <Tabs defaultValue="pricing">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="pricing">Pricing</TabsTrigger>
                      <TabsTrigger value="policy">Policies</TabsTrigger>
                    </TabsList>
                    <TabsContent value="pricing" className="pt-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>30 Minute Session:</span>
                          <span className="font-medium">K500</span>
                        </div>
                        <div className="flex justify-between">
                          <span>60 Minute Session:</span>
                          <span className="font-medium">K900</span>
                        </div>
                        <div className="flex justify-between">
                          <span>90 Minute Session:</span>
                          <span className="font-medium">K1,300</span>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="policy" className="pt-4">
                      <ul className="space-y-2 text-sm">
                        <li>• Cancellations must be made 24 hours in advance.</li>
                        <li>• Rescheduling is free up to 12 hours before.</li>
                        <li>• Meeting links are sent 1 hour before your session.</li>
                      </ul>
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ConsultPage;
