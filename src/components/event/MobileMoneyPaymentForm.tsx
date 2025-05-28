
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';
import { Event } from '@/services/eventService';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useMobileOperators } from '@/hooks/useMobileOperators';

interface MobileMoneyPaymentFormProps {
  event: Event;
  user: User | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const MobileMoneyPaymentForm = ({ 
  event, 
  user, 
  onSuccess, 
  onCancel 
}: MobileMoneyPaymentFormProps) => {
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [mobileOperator, setMobileOperator] = useState('');
  const navigate = useNavigate();
  const { mobileOperators } = useMobileOperators();

  const handleMobileMoneyPayment = async () => {
    if (!user) {
      toast.error("Please sign in to register");
      navigate("/auth");
      return;
    }

    if (!phoneNumber || !mobileOperator) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      // Create event booking first
      const { data: booking, error: bookingError } = await supabase
        .from('event_bookings')
        .insert({
          event_id: event.id,
          user_id: user.id,
          status: 'pending',
          payment_status: 'pending',
          payment_amount: event.price,
          payment_currency: event.currency || 'USD',
          phone_number: phoneNumber,
          mobile_operator: mobileOperator
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Initiate mobile money payment
      const { data, error } = await supabase.functions.invoke('initiate-payment', {
        body: {
          amount: event.price,
          currency: event.currency || 'USD',
          phoneNumber,
          mobileOperator,
          reference_type: 'event',
          reference_id: event.id,
          booking_id: booking.id
        }
      });

      if (error) throw error;

      toast.success('Payment initiated! Please check your phone for payment instructions.');
      onSuccess();
    } catch (error) {
      console.error('Error processing mobile money payment:', error);
      toast.error('Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground mb-2">
          Pay with your mobile money account
        </p>
        <p className="font-semibold">
          Amount: {event.currency} {event.price}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="phoneNumber">Mobile Money Number</Label>
          <Input
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="e.g. 0977123456"
            required
          />
        </div>

        <div>
          <Label htmlFor="mobileOperator">Mobile Network</Label>
          <Select value={mobileOperator} onValueChange={setMobileOperator}>
            <SelectTrigger>
              <SelectValue placeholder="Select mobile operator" />
            </SelectTrigger>
            <SelectContent>
              {mobileOperators.map((operator) => (
                <SelectItem key={operator.code} value={operator.code}>
                  {operator.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleMobileMoneyPayment} disabled={loading}>
          {loading ? "Processing..." : "Pay with Mobile Money"}
        </Button>
      </div>
    </div>
  );
};

export default MobileMoneyPaymentForm;
