
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
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
  Shield
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
        return 'bg-green-50 border-green-200';
      case 'already_checked_in':
        return 'bg-blue-50 border-blue-200';
      case 'error':
        return 'bg-red-50 border-red-200';
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
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Ticket Verification</h1>
              <p className="text-gray-600">Scan or enter ticket details to verify and check-in attendees</p>
            </div>

            {/* Verification Form */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Verify Ticket
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ticketCode">Ticket Code</Label>
                    <Input
                      id="ticketCode"
                      placeholder="Enter ticket code (e.g., TCK-12345678)"
                      value={ticketCode}
                      onChange={(e) => setTicketCode(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bookingCode">Booking Code</Label>
                    <Input
                      id="bookingCode"
                      placeholder="Enter booking code (e.g., EVT-12345678)"
                      value={bookingCode}
                      onChange={(e) => setBookingCode(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="ticketHolderName">Ticket Holder Name (Optional)</Label>
                  <Input
                    id="ticketHolderName"
                    placeholder="Enter ticket holder name for additional verification"
                    value={ticketHolderName}
                    onChange={(e) => setTicketHolderName(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleVerifyTicket}
                    disabled={loading || (!ticketCode.trim() && !bookingCode.trim())}
                    className="bg-gradient-to-r from-orange-500 to-purple-600"
                  >
                    {loading ? 'Verifying...' : 'Verify Ticket'}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Verification Results */}
            {verificationStatus !== 'idle' && (
              <Card className={`${getStatusColor()} transition-all duration-300`}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    {getStatusIcon()}
                    <div className="flex-1">
                      {verificationStatus === 'error' ? (
                        <div>
                          <h3 className="text-lg font-semibold text-red-800 mb-2">
                            ❌ Verification Failed
                          </h3>
                          <p className="text-red-700">{errorMessage}</p>
                        </div>
                      ) : verifiedTicket ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {verificationStatus === 'already_checked_in' ? 
                                '🔹 Already Checked In' : 
                                '✅ Valid Ticket'
                              }
                            </h3>
                            {verificationStatus === 'success' && (
                              <Button 
                                onClick={() => setShowCheckinModal(true)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Check In
                              </Button>
                            )}
                          </div>

                          {/* Attendee Info */}
                          <div className="bg-white rounded-lg p-4 shadow-sm">
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Attendee Information
                            </h4>
                            <div className="flex items-center gap-4">
                              <Avatar className="h-16 w-16">
                                <AvatarImage src={verifiedTicket.user.avatar_url} />
                                <AvatarFallback>
                                  {verifiedTicket.user.full_name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-lg">{verifiedTicket.ticket_holder_name}</p>
                                <p className="text-gray-600">{verifiedTicket.user.full_name}</p>
                                <p className="text-sm text-gray-500">{verifiedTicket.user.email}</p>
                              </div>
                            </div>
                          </div>

                          {/* Ticket Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <Ticket className="h-4 w-4" />
                                Ticket Details
                              </h4>
                              <div className="space-y-2">
                                <div>
                                  <span className="text-sm text-gray-500">Type:</span>
                                  <Badge variant="outline" className="ml-2">
                                    {verifiedTicket.ticket_type.name} - {verifiedTicket.ticket_type.ticket_type}
                                  </Badge>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-500">Ticket Code:</span>
                                  <span className="ml-2 font-mono text-sm">{verifiedTicket.ticket_code}</span>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-500">Booking Code:</span>
                                  <span className="ml-2 font-mono text-sm">{verifiedTicket.booking.booking_code}</span>
                                </div>
                                <div>
                                  <span className="text-sm text-gray-500">Status:</span>
                                  <Badge 
                                    variant={verifiedTicket.checked_in ? "default" : "secondary"} 
                                    className="ml-2"
                                  >
                                    {verifiedTicket.checked_in ? 'Checked In' : 'Not Checked In'}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div className="bg-white rounded-lg p-4 shadow-sm">
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Event Details
                              </h4>
                              <div className="space-y-2">
                                <p className="font-medium">{verifiedTicket.event.title}</p>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Clock className="h-4 w-4" />
                                  {format(new Date(verifiedTicket.event.start_time), 'PPP p')}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
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

      {/* Check-in Confirmation Modal */}
      <Dialog open={showCheckinModal} onOpenChange={setShowCheckinModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Confirm Check-In
            </DialogTitle>
          </DialogHeader>
          
          {verifiedTicket && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Avatar>
                  <AvatarImage src={verifiedTicket.user.avatar_url} />
                  <AvatarFallback>
                    {verifiedTicket.user.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{verifiedTicket.ticket_holder_name}</p>
                  <p className="text-sm text-gray-600">{verifiedTicket.ticket_type.name}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
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
            <Button variant="outline" onClick={() => setShowCheckinModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCheckIn}
              disabled={checkingIn}
              className="bg-green-600 hover:bg-green-700"
            >
              {checkingIn ? 'Checking In...' : 'Confirm Check-In'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default TicketVerificationPage;
