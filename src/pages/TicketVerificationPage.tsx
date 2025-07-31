
import React, { useState } from 'react';
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
  Scan
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
  const { user } = useAuth();
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
      const { data, error } = await supabase.functions.invoke('verify-ticket', {
        body: {
          ticketCode: ticketCode.trim() || undefined,
          bookingCode: bookingCode.trim() || undefined,
          ticketHolderName: ticketHolderName.trim() || undefined,
          verifierUserId: user.id
        }
      });

      if (error) throw error;

      if (data.success) {
        setVerifiedTicket(data.ticket);
        if (data.already_checked_in) {
          setVerificationStatus('already_checked_in');
        } else {
          setVerificationStatus('success');
        }
        toast.success('Ticket verified successfully!');
      } else {
        setVerificationStatus('error');
        if (data.error === 'unauthorized') {
          setVerificationStatus('unauthorized');
          setErrorMessage('You are not authorized to verify tickets for this event. You can only verify tickets for events you have created.');
        } else {
          setErrorMessage(data.message || 'Ticket verification failed');
        }
        toast.error(data.message || 'Ticket verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationStatus('error');
      setErrorMessage('Failed to verify ticket. Please try again.');
      toast.error('Failed to verify ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleScanResult = (scannedCode: string) => {
    // Determine if it's a ticket code or booking code based on format
    if (scannedCode.startsWith('TCK-')) {
      setTicketCode(scannedCode);
    } else if (scannedCode.startsWith('EVT-')) {
      setBookingCode(scannedCode);
    } else {
      // Default to ticket code if format is unclear
      setTicketCode(scannedCode);
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
        }
      });

      if (error) throw error;

      if (data.success) {
        setVerifiedTicket(prev => prev ? { ...prev, checked_in: true } : null);
        setVerificationStatus('already_checked_in');
        setShowCheckinModal(false);
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
                  You can only verify tickets for events you have created
                </p>
              )}
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

            {/* Enhanced Verification Results */}
            {verificationStatus !== 'idle' && (
              <Card className={`${getStatusColor()} transition-all duration-300 shadow-2xl border-0`}>
                <CardContent className="p-8">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      {getStatusIcon()}
                    </div>
                    <div className="flex-1">
                      {verificationStatus === 'error' || verificationStatus === 'unauthorized' ? (
                        <div>
                          <h3 className="text-2xl font-bold text-red-800 mb-3">
                            ❌ Verification Failed
                          </h3>
                          <p className="text-red-700 text-lg">{errorMessage}</p>
                          {verificationStatus === 'unauthorized' && (
                            <div className="mt-4 p-4 bg-red-100 rounded-lg border border-red-200">
                              <p className="text-red-800 text-sm">
                                <strong>Access Restricted:</strong> As a creator, you can only verify tickets for events that you have created. 
                                If you believe this is an error, please contact the event organizer.
                              </p>
                            </div>
                          )}
                        </div>
                      ) : verifiedTicket ? (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-bold text-gray-900">
                              {verificationStatus === 'already_checked_in' ? 
                                '🔹 Already Checked In' : 
                                '✅ Valid Ticket'
                              }
                            </h3>
                            {verificationStatus === 'success' && (
                              <Button 
                                onClick={() => setShowCheckinModal(true)}
                                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
                                size="lg"
                              >
                                <CheckCircle className="h-5 w-5 mr-2" />
                                Check In
                              </Button>
                            )}
                          </div>

                          {/* Enhanced Attendee Info */}
                          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                            <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                              <User className="h-5 w-5 text-orange-500" />
                              Attendee Information
                            </h4>
                            <div className="flex items-center gap-6">
                              <Avatar className="h-20 w-20 ring-4 ring-orange-200">
                                <AvatarImage src={verifiedTicket.user.avatar_url} />
                                <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-orange-500 to-purple-600 text-white">
                                  {verifiedTicket.user.full_name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="space-y-1">
                                <p className="font-bold text-2xl text-gray-900">{verifiedTicket.ticket_holder_name}</p>
                                <p className="text-lg text-gray-700">{verifiedTicket.user.full_name}</p>
                                <p className="text-sm text-gray-500">{verifiedTicket.user.email}</p>
                              </div>
                            </div>
                          </div>

                          {/* Enhanced Ticket Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                              <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <Ticket className="h-5 w-5 text-purple-500" />
                                Ticket Details
                              </h4>
                              <div className="space-y-3">
                                <div>
                                  <span className="text-sm font-medium text-gray-500">Type:</span>
                                  <Badge variant="outline" className="ml-2 bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0">
                                    {verifiedTicket.ticket_type.name} - {verifiedTicket.ticket_type.ticket_type}
                                  </Badge>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-gray-500">Ticket Code:</span>
                                  <span className="ml-2 font-mono text-sm bg-gray-100 px-2 py-1 rounded">{verifiedTicket.ticket_code}</span>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-gray-500">Booking Code:</span>
                                  <span className="ml-2 font-mono text-sm bg-gray-100 px-2 py-1 rounded">{verifiedTicket.booking.booking_code}</span>
                                </div>
                                <div>
                                  <span className="text-sm font-medium text-gray-500">Status:</span>
                                  <Badge 
                                    variant={verifiedTicket.checked_in ? "default" : "secondary"} 
                                    className={`ml-2 ${verifiedTicket.checked_in ? 'bg-green-500' : 'bg-gray-500'}`}
                                  >
                                    {verifiedTicket.checked_in ? 'Checked In' : 'Not Checked In'}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                              <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-blue-500" />
                                Event Details
                              </h4>
                              <div className="space-y-3">
                                <p className="font-bold text-lg text-gray-900">{verifiedTicket.event.title}</p>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Clock className="h-4 w-4" />
                                  {format(new Date(verifiedTicket.event.start_time), 'PPP p')}
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <MapPin className="h-4 w-4" />
                                  {verifiedTicket.event.location}
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

      {/* Enhanced Check-in Confirmation Modal */}
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
