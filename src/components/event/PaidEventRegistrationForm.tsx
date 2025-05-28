
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Smartphone } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { Event } from '@/services/eventService';
import StripePaymentForm from './StripePaymentForm';
import MobileMoneyPaymentForm from './MobileMoneyPaymentForm';

interface PaidEventRegistrationFormProps {
  event: Event;
  user: User | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const PaidEventRegistrationForm = ({ 
  event, 
  user, 
  onSuccess, 
  onCancel 
}: PaidEventRegistrationFormProps) => {
  const [activeTab, setActiveTab] = useState("stripe");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose Payment Method</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stripe" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Card Payment
            </TabsTrigger>
            <TabsTrigger value="mobile" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Mobile Money
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="stripe">
            <StripePaymentForm 
              event={event}
              user={user}
              onSuccess={onSuccess}
              onCancel={onCancel}
            />
          </TabsContent>
          
          <TabsContent value="mobile">
            <MobileMoneyPaymentForm 
              event={event}
              user={user}
              onSuccess={onSuccess}
              onCancel={onCancel}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PaidEventRegistrationForm;
