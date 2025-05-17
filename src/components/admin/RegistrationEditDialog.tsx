
import { CombinedRegistration } from '@/types/eventTypes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RegistrationEditDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  registration: CombinedRegistration | null;
  onUpdate: (registration: CombinedRegistration, status: string, paymentStatus: string) => void;
  setRegistration: (registration: CombinedRegistration | null) => void;
}

const RegistrationEditDialog = ({
  isOpen,
  setIsOpen,
  registration,
  onUpdate,
  setRegistration
}: RegistrationEditDialogProps) => {
  if (!registration) return null;
  
  // Safely get the full name
  const fullName = registration.profiles && 'full_name' in registration.profiles 
    ? registration.profiles.full_name 
    : 'Unknown';
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Registration</DialogTitle>
          <DialogDescription>
            Update the status of this registration.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium">{registration.events?.title}</h4>
            <p className="text-sm">Attendee: {fullName || 'Unknown'}</p>
            <Badge>Event Booking</Badge>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="status">Registration Status</Label>
            <Select
              defaultValue={registration.status}
              onValueChange={(value) => {
                setRegistration({
                  ...registration,
                  status: value
                });
              }}
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
          
          <div className="grid gap-2">
            <Label htmlFor="payment-status">Payment Status</Label>
            <Select
              defaultValue={registration.payment_status}
              onValueChange={(value) => {
                setRegistration({
                  ...registration,
                  payment_status: value
                });
              }}
            >
              <SelectTrigger id="payment-status">
                <SelectValue placeholder="Select payment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button 
            onClick={() => {
              if (registration) {
                onUpdate(
                  registration,
                  registration.status, 
                  registration.payment_status
                );
              }
            }}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RegistrationEditDialog;
