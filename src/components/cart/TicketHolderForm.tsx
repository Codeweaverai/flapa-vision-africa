
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, Minus } from 'lucide-react';

interface TicketHolder {
  name: string;
  email?: string;
}

interface TicketHolderFormProps {
  eventTitle: string;
  quantity: number;
  ticketHolders: TicketHolder[];
  onUpdateTicketHolders: (holders: TicketHolder[]) => void;
  onUpdateQuantity: (quantity: number) => void;
  maxQuantity?: number;
}

const TicketHolderForm: React.FC<TicketHolderFormProps> = ({
  eventTitle,
  quantity,
  ticketHolders,
  onUpdateTicketHolders,
  onUpdateQuantity,
  maxQuantity = 10
}) => {
  const [holders, setHolders] = useState<TicketHolder[]>(ticketHolders);

  useEffect(() => {
    // Ensure we have the right number of ticket holders
    const newHolders = [...holders];
    
    if (newHolders.length < quantity) {
      // Add missing holders
      for (let i = newHolders.length; i < quantity; i++) {
        newHolders.push({ name: '', email: '' });
      }
    } else if (newHolders.length > quantity) {
      // Remove extra holders
      newHolders.splice(quantity);
    }
    
    setHolders(newHolders);
    onUpdateTicketHolders(newHolders);
  }, [quantity]);

  const updateHolder = (index: number, field: keyof TicketHolder, value: string) => {
    const newHolders = [...holders];
    newHolders[index] = { ...newHolders[index], [field]: value };
    setHolders(newHolders);
    onUpdateTicketHolders(newHolders);
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      onUpdateQuantity(newQuantity);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Ticket Details - {eventTitle}</span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="mx-2 font-medium">{quantity}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= maxQuantity}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: quantity }).map((_, index) => (
          <div key={index} className="p-4 border rounded-lg bg-gray-50">
            <h4 className="font-medium mb-3">Ticket {index + 1}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`name-${index}`}>Full Name *</Label>
                <Input
                  id={`name-${index}`}
                  placeholder="Enter ticket holder name"
                  value={holders[index]?.name || ''}
                  onChange={(e) => updateHolder(index, 'name', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor={`email-${index}`}>Email (Optional)</Label>
                <Input
                  id={`email-${index}`}
                  type="email"
                  placeholder="Enter email address"
                  value={holders[index]?.email || ''}
                  onChange={(e) => updateHolder(index, 'email', e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Please ensure all ticket holder names are accurate as they will appear on the generated tickets. 
            Names can be updated before the event if needed.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TicketHolderForm;
