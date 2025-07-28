
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
  Scan,
  Camera,
  Keyboard,
  Sparkles
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
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error' | 'already_checked_in'>('idle');
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

    setLoading(true);
    setVerificationStatus('idle');
    setErrorMessage('');

    try {
      const { data, error } = await supabase.functions.invoke('verify-ticket', {
        body: {
          ticketCode: ticketCode.trim() || undefined,
          bookingCode: bookingCode.trim() || undefined,
          ticketHolderName: ticketHolderName.trim() || undefined
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
        setErrorMessage(data.message || 'Ticket verification failed');
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

  const handleScanResult = (scannedData: string) => {
    setShowScanner(false);
    
    try {
      // Try to parse the scanned QR code data
      const qrData = JSON.parse(scannedData);
      
      if (qrData.ticket_code) {
        setTicketCode(qrData.ticket_code);
        setActiveTab('manual');
        toast.success('QR code scanned successfully!');
        
        // Auto-verify if we have enough data
        setTimeout(() => {
          handleVerifyTicket();
        }, 500);
      } else if (qrData.booking_code) {
        setBookingCode(qrData.booking_code);
        setActiveTab('manual');
        toast.success('QR code scanned successfully!');
        
        // Auto-verify if we have enough data
        setTimeout(() => {
          handleVerifyTicket();
        }, 500);
      } else {
        // Try to use the raw scanned data as ticket code
        setTicketCode(scannedData);
        setActiveTab('manual');
        toast.success('Barcode scanned successfully!');
      }
    } catch (error) {
      // If JSON parsing fails, use raw data as ticket code
      setTicketCode(scannedData);
      setActiveTab('manual');
      toast.success('Barcode scanned successfully!');
    }
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
        return 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200';
      case 'already_checked_in':
        return 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200';
      case 'error':
        return 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200';
      default:
        return 'bg-white';
    }
  };

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'already_checked_in':
        return <Shield className="h-8 w-8 text-blue-600" />;
      case 'error':
        return <XCircle className="h-8 w-8 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {/* Enhanced Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-4 rounded-full shadow-lg">
                  <Ticket className="h-10 w-10 text-white" />
                </div>
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent mb-3">
                Event Ticket Verification
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Verify and check-in attendees using multiple methods - scan QR codes, enter ticket codes, or use booking details
              </p>
            </div>

            {/* Enhanced Verification Form */}
            <Card className="mb-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Sparkles className="h-6 w-6" />
                  Ticket Verification Methods
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                  <TabsList className="grid w-full grid-cols-2 h-12">
                    <TabsTrigger value="scanner" className="flex items-center gap-2 text-base">
                      <Camera className="h-4 w-4" />
                      QR/Barcode Scanner
                    </TabsTrigger>
                    <TabsTrigger value="manual" className="flex items-center gap-2 text-base">
                      <Keyboard className="h-4 w-4" />
                      Manual Entry
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="scanner" className="space-y-6">
                    <div className="text-center">
                      <div className="bg-gradient-to-r from-orange-100 to-purple-100 p-8 rounded-xl mb-6">
                        <Scan className="h-16 w-16 mx-auto text-orange-600 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          Scan QR Code or Barcode
                        </h3>
                        <p className="text-gray-600 mb-6">
                          Use your device camera to scan the QR code or barcode on the ticket
                        </p>
                        <Button
                          onClick={() => setShowScanner(true)}
                          className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-lg px-8 py-3 h-auto"
                        >
                          <Camera className="h-5 w-5 mr-2" />
                          Start Camera Scanner
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

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
                          className="font-mono text-base h-12"
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
                          className="font-mono text-base h-12"
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
                        className="text-base h-12"
                      />
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button 
                        onClick={handleVerifyTicket}
                        disabled={loading || (!ticketCode.trim() && !bookingCode.trim())}
                        className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-lg px-8 py-3 h-auto flex-1"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Verifying...
                          </>
                        ) : (
                          <>
                            <Search className="h-5 w-5 mr-2" />
                            Verify Ticket
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={resetForm} className="text-base px-6 py-3 h-auto">
                        Reset
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Enhanced Verification Results */}
            {verificationStatus !== 'idle' && (
              <Card className={`${getStatusColor()} transition-all duration-500 shadow-xl border-2`}>
                <CardContent className="pt-8">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      {getStatusIcon()}
                    </div>
                    <div className="flex-1">
                      {verificationStatus === 'error' ? (
                        <div className="text-center">
                          <h3 className="text-2xl font-bold text-red-800 mb-3">
                            ❌ Verification Failed
                          </h3>
                          <p className="text-red-700 text-lg">{errorMessage}</p>
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
                                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-lg px-6 py-3 h-auto"
                              >
                                <CheckCircle className="h-5 w-5 mr-2" />
                                Check In Attendee
                              </Button>
                            )}
                          </div>

                          {/* Enhanced Attendee Info */}
                          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                            <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                              <User className="h-5 w-5" />
                              Attendee Information
                            </h4>
                            <div className="flex items-center gap-6">
                              <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                                <AvatarImage src={verifiedTicket.user.avatar_url} />
                                <AvatarFallback className="text-2xl">
                                  {verifiedTicket.user.full_name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-bold text-2xl text-gray-900">{verifiedTicket.ticket_holder_name}</p>
                                <p className="text-lg text-gray-700">{verifiedTicket.user.full_name}</p>
                                <p className="text-gray-600">{verifiedTicket.user.email}</p>
                              </div>
                            </div>
                          </div>

                          {/* Enhanced Details Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                              <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <Ticket className="h-5 w-5" />
                                Ticket Details
                              </h4>
                              <div className="space-y-3">
                                <div>
                                  <span className="text-sm text-gray-500">Type:</span>
                                  <Badge variant="outline" className="ml-2 text-base">
                                    {verifiedTicket.ticket_type.name} - {verifiedTicket.ticket_type.ticket_type}
                                  </Badge>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-500">Ticket Code:</span>
                                  <span className="ml-2 font-mono text-base bg-gray-100 px-2 py-1 rounded">
                                    {verifiedTicket.ticket_code}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-500">Booking Code:</span>
                                  <span className="ml-2 font-mono text-base bg-gray-100 px-2 py-1 rounded">
                                    {verifiedTicket.booking.booking_code}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-500">Status:</span>
                                  <Badge 
                                    variant={verifiedTicket.checked_in ? "default" : "secondary"} 
                                    className="ml-2 text-base"
                                  >
                                    {verifiedTicket.checked_in ? 'Checked In' : 'Not Checked In'}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                              <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Event Details
                              </h4>
                              <div className="space-y-3">
                                <p className="font-bold text-lg text-gray-900">{verifiedTicket.event.title}</p>
                                <div className="flex items-center gap-2 text-gray-700">
                                  <Clock className="h-4 w-4" />
                                  <span className="text-base">
                                    {format(new Date(verifiedTicket.event.start_time), 'PPP p')}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700">
                                  <MapPin className="h-4 w-4" />
                                  <span className="text-base">{verifiedTicket.event.location}</span>
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
      <BarcodeScanner
        isOpen={showScanner}
        onScan={handleScanResult}
        onClose={() => setShowScanner(false)}
      />

      {/* Enhanced Check-in Confirmation Modal */}
      <Dialog open={showCheckinModal} onOpenChange={setShowCheckinModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Confirm Check-In
            </DialogTitle>
          </DialogHeader>
          
          {verifiedTicket && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={verifiedTicket.user.avatar_url} />
                  <AvatarFallback>
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
                  <p className="font-medium text-blue-800">Confirm Check-In</p>
                  <p className="text-sm text-blue-700">
                    This will mark the ticket as checked in and cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCheckinModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCheckIn}
              disabled={checkingIn}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              {checkingIn ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Checking In...
                </>
              ) : (
                'Confirm Check-In'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default TicketVerificationPage;
