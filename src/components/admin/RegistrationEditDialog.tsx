
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CombinedRegistration } from '@/types/eventTypes';
import { useMobileOperators } from '@/hooks/useMobileOperators';

interface RegistrationEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  registration: CombinedRegistration;
  onSave: (updatedRegistration: CombinedRegistration) => void;
}

const RegistrationEditDialog = ({
  isOpen,
  onClose,
  registration,
  onSave,
}: RegistrationEditDialogProps) => {
  const [updatedRegistration, setUpdatedRegistration] = useState<CombinedRegistration>(registration);
  const [loading, setLoading] = useState(false);
  const { mobileOperators } = useMobileOperators();

  const handleChange = (field: keyof CombinedRegistration, value: string) => {
    setUpdatedRegistration((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      onSave(updatedRegistration);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Registration</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={updatedRegistration.status}
                onValueChange={(value) => handleChange('status', value)}
                disabled={loading}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_status">Payment Status</Label>
              <Select
                value={updatedRegistration.payment_status}
                onValueChange={(value) => handleChange('payment_status', value)}
                disabled={loading}
              >
                <SelectTrigger id="payment_status">
                  <SelectValue placeholder="Select payment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input
              id="phone_number"
              value={updatedRegistration.phone_number || ''}
              onChange={(e) => handleChange('phone_number', e.target.value)}
              disabled={loading}
              placeholder="Enter phone number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobile_operator">Mobile Operator</Label>
            <Select
              value={updatedRegistration.mobile_operator || ''}
              onValueChange={(value) => handleChange('mobile_operator', value)}
              disabled={loading}
            >
              <SelectTrigger id="mobile_operator">
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

          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RegistrationEditDialog;
