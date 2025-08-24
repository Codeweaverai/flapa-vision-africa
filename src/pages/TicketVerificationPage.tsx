
import React, { useState, useRef, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import BarcodeScanner from '@/components/tickets/BarcodeScanner';
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  User, 
  Ticket, 
  Calendar, 
  MapPin,
  Clock,
  AlertCircle,
  Shield,
  Camera,
  Smartphone,
  Scan,
  Volume2,
  VolumeX
} from 'lucide-react';
import { format } from 'date-fns';

interface VerifiedTicket {
  id: string;
  ticket_code: string;
  ticket_holder_name: string;
  checked_in: boolean;
  booking_id: string;
  event_id: string;
  event: {
    title: string;
    start_time: string;
    end_time: string;
    location: string;
    creator_id: string;
  };
  ticket_type: {
    name: string;
    ticket_type: string;
    price: number;
  };
  user: {
    full_name: string;
    avatar_url?: string;
    email: string;
  };
  booking: {
    booking_code: string;
    status: string;
    payment_status: string;
  };
}

const TicketVerificationPage = () => {
  const { user, session } = useAuth();
  const [ticketCode, setTicketCode] = useState('');
  const [bookingCode, setBookingCode] = useState('');
  const [ticketHolderName, setTicketHolderName] = useState('');
  const [verifiedTicket, setVerifiedTicket] = useState<VerifiedTicket | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error' | 'already_checked_in' | 'unauthorized'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [audioInitialized, setAudioInitialized] = useState(false);
  
  // Audio references
  const successSoundRef = useRef<HTMLAudioElement>(null);
  const errorSoundRef = useRef<HTMLAudioElement>(null);
  const checkinSoundRef = useRef<HTMLAudioElement>(null);

  // Helper function to get authentication headers
  const getAuthHeaders = () => {
    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    return headers;
  };

  // Initialize audio on user interaction (to bypass autoplay restrictions)
  useEffect(() => {
    const initializeAudio = () => {
      if (audioInitialized) return;
      
      // Preload and initialize audio elements
      if (successSoundRef.current) {
        successSoundRef.current.volume = 0.7;
        successSoundRef.current.load();
      }
      if (errorSoundRef.current) {
        errorSoundRef.current.volume = 0.7;
        errorSoundRef.current.load();
      }
      if (checkinSoundRef.current) {
        checkinSoundRef.current.volume = 0.7;
        checkinSoundRef.current.load();
      }
      
      setAudioInitialized(true);
    };

    // Initialize audio on any user interaction
    const handleUserInteraction = () => {
      initializeAudio();
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [audioInitialized]);

  // Improved sound playing function
  const playSound = (soundRef: React.RefObject<HTMLAudioElement>) => {
    if (!soundEnabled || !soundRef.current) return;
    
    try {
      // Create a clone of the audio element to avoid conflicts
      const clone = soundRef.current.cloneNode(true) as HTMLAudioElement;
      clone.volume = 0.7;
      
      const playPromise = clone.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Audio played successfully
            // Remove the clone after it finishes playing
            clone.onended = () => {
              if (document.body.contains(clone)) {
                document.body.removeChild(clone);
              }
            };
          })
          .catch(error => {
            console.log('Audio play failed:', error);
            // Fallback to original method
            soundRef.current.currentTime = 0;
            soundRef.current.play().catch(e => console.log('Fallback audio play failed:', e));
          });
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  // Play success sound
  const playSuccessSound = () => {
    playSound(successSoundRef);
  };

  // Play error sound
  const playErrorSound = () => {
    playSound(errorSoundRef);
  };

  // Play check-in sound
  const playCheckinSound = () => {
    playSound(checkinSoundRef);
  };

  // Test sound function
  const testSound = (type: 'success' | 'error' | 'checkin') => {
    switch (type) {
      case 'success':
        playSuccessSound();
        break;
      case 'error':
        playErrorSound();
        break;
      case 'checkin':
        playCheckinSound();
        break;
    }
  };

  const handleVerifyTicket = async () => {
    if (!ticketCode.trim() && !bookingCode.trim()) {
      toast.error('Please enter either a ticket code or booking code');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to verify tickets');
      return;
    }

    setLoading(true);
    setVerificationStatus('idle');
    setErrorMessage('');

    try {
      // Normalize ticket codes
      const normalizedTicketCode = ticketCode.trim().toUpperCase();
      const normalizedBookingCode = bookingCode.trim().toUpperCase();

      const { data, error } = await supabase.functions.invoke('verify-ticket', {
        body: {
          ticketCode: normalizedTicketCode || undefined,
          bookingCode: normalizedBookingCode || undefined,
          ticketHolderName: ticketHolderName.trim() || undefined,
          verifierUserId: user.id
        },
        headers: getAuthHeaders()
      });

      if (error) throw error;

      if (data.success) {
        setVerifiedTicket(data.ticket);
        if (data.already_checked_in) {
          setVerificationStatus('already_checked_in');
        } else {
          setVerificationStatus('success');
          playSuccessSound();
        }
        toast.success('Ticket verified successfully!');
      } else {
        setVerificationStatus('error');
        if (data.error === 'unauthorized') {
          setVerificationStatus('unauthorized');
          setErrorMessage('You are not authorized to verify tickets for this event. You can only verify tickets for events you have created or manage.');
        } else {
          setErrorMessage(data.message || 'Ticket verification failed');
        }
        playErrorSound();
        toast.error(data.message || 'Ticket verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStatus('error');
      setErrorMessage('Failed to verify ticket. Please try again.');
      playErrorSound();
      toast.error('Failed to verify ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleScanResult = (scannedCode: string) => {
    // Normalize scanned code
    const normalizedCode = scannedCode.trim().toUpperCase();
    
    // Determine if it's a ticket code or booking code based on format
    if (normalizedCode.startsWith('TCK-')) {
      setTicketCode(normalizedCode);
    } else if (normalizedCode.startsWith('EVT-')) {
      setBookingCode(normalizedCode);
    } else {
      // Default to ticket code if format is unclear
      setTicketCode(normalizedCode);
    }
    
    setShowScanner(false);
    setActiveTab('manual');
    
    // Auto-verify after a short delay
    setTimeout(() => {
      handleVerifyTicket();
    }, 500);
  };

  const handleCheckIn = async () => {
    if (!verifiedTicket || !user) return;

    setCheckingIn(true);
    try {
      const { data, error } = await supabase.functions.invoke('checkin-ticket', {
        body: {
          ticketId: verifiedTicket.id,
          bookingId: verifiedTicket.booking_id,
          eventId: verifiedTicket.event_id,
          checkedInBy: user.id
        },
        headers: getAuthHeaders()
      });

      if (error) throw error;

      if (data.success) {
        setVerifiedTicket(prev => prev ? { ...prev, checked_in: true } : null);
        setVerificationStatus('already_checked_in');
        setShowCheckinModal(false);
        playCheckinSound();
        toast.success('✅ Ticket checked in successfully!');
      } else {
        throw new Error(data.message || 'Check-in failed');
      }
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error('Failed to check in ticket. Please try again.');
    } finally {
      setCheckingIn(false);
    }
  };

  const resetForm = () => {
    setTicketCode('');
    setBookingCode('');
    setTicketHolderName('');
    setVerifiedTicket(null);
    setVerificationStatus('idle');
    setErrorMessage('');
  };

  const getStatusColor = () => {
    switch (verificationStatus) {
      case 'success':
        return 'bg-green-50 border-green-200 backdrop-blur-sm';
      case 'already_checked_in':
        return 'bg-blue-50 border-blue-200 backdrop-blur-sm';
      case 'error':
      case 'unauthorized':
        return 'bg-red-50 border-red-200 backdrop-blur-sm';
      default:
        return 'bg-white/70 backdrop-blur-sm';
    }
  };

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'already_checked_in':
        return <Shield className="h-8 w-8 text-blue-600" />;
      case 'error':
      case 'unauthorized':
        return <XCircle className="h-8 w-8 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <Layout>
      {/* Audio elements for sounds - with more attributes for better compatibility */}
      <audio 
        ref={successSoundRef} 
        src="/lovable-uploads/success.mp3" 
        preload="auto" 
        className="hidden"
      />
      <audio 
        ref={errorSoundRef} 
        src="/lovable-uploads/error.mp3" 
        preload="auto" 
        className="hidden"
      />
      <audio 
        ref={checkinSoundRef} 
        src="/lovable-uploads/checkin.mp3" 
        preload="auto" 
        className="hidden"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-purple-600 rounded-full mb-4">
                <Ticket className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Event Ticket Verification
              </h1>
              <p className="text-xl text-gray-600">
                Scan or enter ticket details to verify and check-in attendees
              </p>
              {user && (
                <p className="text-sm text-gray-500 mt-2">
                  You can verify tickets for events you have created or manage as an editor
                </p>
              )}
              
              {/* Sound Toggle Button and Test Buttons */}
              <div className="mt-4 flex flex-col items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="flex items-center gap-2"
                >
                  {soundEnabled ? (
                    <>
                      <Volume2 className="h-4 w-4" />
                      Sound On
                    </>
                  ) : (
                    <>
                      <VolumeX className="h-4 w-4" />
                      Sound Off
                    </>
                  )}
                </Button>
                
                {/* Test sound buttons - remove in production */}
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testSound('success')}
                    className="text-xs"
                  >
                    Test Success
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testSound('error')}
                    className="text-xs"
                  >
                    Test Error
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testSound('checkin')}
                    className="text-xs"
                  >
                    Test Check-in
                  </Button>
                </div>
              </div>
            </div>

            {/* Enhanced Verification Form */}
            <Card className="mb-8 bg-white/70 backdrop-blur-sm border-0 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Search className="h-6 w-6" />
                  Verify Ticket
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="manual" className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Manual Entry
                    </TabsTrigger>
                    <TabsTrigger value="scanner" className="flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      Barcode Scanner
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="manual" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="ticketCode" className="text-base font-medium">
                          Ticket Code
                        </Label>
                        <Input
                          id="ticketCode"
                          placeholder="Enter ticket code (e.g., TCK-12345678)"
                          value={ticketCode}
                          onChange={(e) => setTicketCode(e.target.value)}
                          className="font-mono text-lg h-12 bg-white/50 border-2 focus:border-orange-500 transition-all duration-200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bookingCode" className="text-base font-medium">
                          Booking Code
                        </Label>
                        <Input
                          id="bookingCode"
                          placeholder="Enter booking code (e.g., EVT-12345678)"
                          value={bookingCode}
                          onChange={(e) => setBookingCode(e.target.value)}
                          className="font-mono text-lg h-12 bg-white/50 border-2 focus:border-purple-500 transition-all duration-200"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="ticketHolderName" className="text-base font-medium">
                        Ticket Holder Name (Optional)
                      </Label>
                      <Input
                        id="ticketHolderName"
                        placeholder="Enter ticket holder name for additional verification"
                        value={ticketHolderName}
                        onChange={(e) => setTicketHolderName(e.target.value)}
                        className="text-lg h-12 bg-white/50 border-2 focus:border-orange-500 transition-all duration-200"
                      />
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button 
                        onClick={handleVerifyTicket}
                        disabled={loading || (!ticketCode.trim() && !bookingCode.trim())}
                        className="flex-1 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
                        size="lg"
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Verifying...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Search className="h-5 w-5" />
                            Verify Ticket
                          </div>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={resetForm}
                        className="px-6 py-3 border-2 hover:bg-gray-50 transition-all duration-200"
                        size="lg"
                      >
                        Reset
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="scanner" className="space-y-6">
                    <div className="text-center space-y-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-purple-600 rounded-full mb-4">
                        <Scan className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        Scan Ticket Barcode
                      </h3>
                      <p className="text-gray-600 max-w-md mx-auto">
                        Use your device camera to scan QR codes or barcodes on tickets for instant verification
                      </p>
                      
                      <Button
                        onClick={() => setShowScanner(true)}
                        className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
                        size="lg"
                      >
                        <Camera className="h-5 w-5 mr-2" />
                        Start Scanner
                      </Button>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Supports QR codes
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Supports standard barcodes
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Auto-verification
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Instant results
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Mobile-Optimized Verification Results */}
            {verificationStatus !== 'idle' && (
              <Card className={`${getStatusColor()} transition-all duration-300 shadow-2xl border-0 mx-0 sm:mx-0`}>
                <CardContent className="p-4 sm:p-8">
                  <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                    <div className="flex-shrink-0 mx-auto sm:mx-0">
                      {getStatusIcon()}
                    </div>
                    <div className="flex-1 w-full">
                      {verificationStatus === 'error' || verificationStatus === 'unauthorized' ? (
                        <div className="text-center sm:text-left">
                          <h3 className="text-xl sm:text-2xl font-bold text-red-800 mb-2 sm:mb-3">
                            ❌ Verification Failed
                          </h3>
                          <p className="text-red-700 text-base sm:text-lg">{errorMessage}</p>
                          {verificationStatus === 'unauthorized' && (
                            <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-red-100 rounded-lg border border-red-200">
                              <p className="text-red-800 text-xs sm:text-sm">
                                <strong>Access Restricted:</strong> You can only verify tickets for events that you have created or manage as an editor. 
                                If you believe this is an error, please contact the event organizer.
                              </p>
                            </div>
                          )}
                        </div>
                      ) : verifiedTicket ? (
                        <div className="space-y-4 sm:space-y-6">
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 text-center sm:text-left">
                              {verificationStatus === 'already_checked_in' ? 
                                '🔹 Already Checked In' : 
                                '✅ Valid Ticket'
                              }
                            </h3>
                            {verificationStatus === 'success' && (
                              <Button 
                                onClick={() => setShowCheckinModal(true)}
                                className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
                                size="lg"
                              >
                                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                Check In
                              </Button>
                            )}
                          </div>

                          {/* Attendee Info - Mobile Responsive */}
                          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg">
                            <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 flex items-center justify-center sm:justify-start gap-2">
                              <User className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                              Attendee Information
                            </h4>
                            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                              <Avatar className="h-16 w-16 sm:h-20 sm:w-20 ring-2 sm:ring-4 ring-orange-200">
                                <AvatarImage src={verifiedTicket.user.avatar_url} />
                                <AvatarFallback className="text-lg sm:text-xl font-bold bg-gradient-to-br from-orange-500 to-purple-600 text-white">
                                  {verifiedTicket.user.full_name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="space-y-1 text-center sm:text-left">
                                <p className="font-bold text-xl sm:text-2xl text-gray-900">{verifiedTicket.ticket_holder_name}</p>
                                <p className="text-base sm:text-lg text-gray-700">{verifiedTicket.user.full_name}</p>
                                <p className="text-xs sm:text-sm text-gray-500 break-all">{verifiedTicket.user.email}</p>
                              </div>
                            </div>
                          </div>

                          {/* Ticket Details - Mobile Grid */}
                          <div className="grid grid-cols-1 gap-4 sm:gap-6">
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg">
                              <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 flex items-center justify-center sm:justify-start gap-2">
                                <Ticket className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                                Ticket Details
                              </h4>
                              <div className="space-y-2 sm:space-y-3">
                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1 sm:gap-2">
                                  <span className="text-xs sm:text-sm font-medium text-gray-500">Type:</span>
                                  <Badge variant="outline" className="bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0 text-xs sm:text-sm">
                                    {verifiedTicket.ticket_type.name} - {verifiedTicket.ticket_type.ticket_type}
                                  </Badge>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1 sm:gap-2">
                                  <span className="text-xs sm:text-sm font-medium text-gray-500">Ticket Code:</span>
                                  <span className="font-mono text-xs sm:text-sm bg-gray-100 px-2 py-1 rounded">{verifiedTicket.ticket_code}</span>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1 sm:gap-2">
                                  <span className="text-xs sm:text-sm font-medium text-gray-500">Booking Code:</span>
                                  <span className="font-mono text-xs sm:text-sm bg-gray-100 px-2 py-1 rounded">{verifiedTicket.booking.booking_code}</span>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1 sm:gap-2">
                                  <span className="text-xs sm:text-sm font-medium text-gray-500">Status:</span>
                                  <Badge 
                                    variant={verifiedTicket.checked_in ? "default" : "secondary"} 
                                    className={`${verifiedTicket.checked_in ? 'bg-green-500' : 'bg-gray-500'} text-xs sm:text-sm`}
                                  >
                                    {verifiedTicket.checked_in ? 'Checked In' : 'Not Checked In'}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg">
                              <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4 flex items-center justify-center sm:justify-start gap-2">
                                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                                Event Details
                              </h4>
                              <div className="space-y-2 sm:space-y-3 text-center sm:text-left">
                                <p className="font-bold text-lg text-gray-900">{verifiedTicket.event.title}</p>
                                <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-600">
                                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span className="text-xs sm:text-sm">{format(new Date(verifiedTicket.event.start_time), 'PPP p')}</span>
                                </div>
                                <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-600">
                                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span className="text-xs sm:text-sm">{verifiedTicket.event.location}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="sm:max-w-md">
          <BarcodeScanner
            onScan={handleScanResult}
            onClose={() => setShowScanner(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Check-in Confirmation Modal */}
      <Dialog open={showCheckinModal} onOpenChange={setShowCheckinModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Confirm Check-In
            </DialogTitle>
          </DialogHeader>
          
          {verifiedTicket && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg">
                <Avatar className="h-12 w-12 ring-2 ring-orange-200">
                  <AvatarImage src={verifiedTicket.user.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-orange-500 to-purple-600 text-white">
                    {verifiedTicket.user.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-lg">{verifiedTicket.ticket_holder_name}</p>
                  <p className="text-sm text-gray-600">{verifiedTicket.ticket_type.name}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Confirm Check-In</p>
                  <p className="text-sm text-blue-700">
                    This will mark the ticket as checked in and cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCheckinModal(false)}
              className="px-6"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCheckIn}
              disabled={checkingIn}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6"
            >
              {checkingIn ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Checking In...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Confirm Check-In
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default TicketVerificationPage;
