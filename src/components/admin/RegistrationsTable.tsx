
import { CombinedRegistration } from '@/types/eventTypes';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { formatDate } from '@/lib/utils';

interface RegistrationsTableProps {
  registrations: CombinedRegistration[];
  onEdit: (registration: CombinedRegistration) => void;
  onDelete: (registration: CombinedRegistration) => void;
  loading: boolean;
}

const RegistrationsTable = ({ 
  registrations, 
  onEdit, 
  onDelete, 
  loading 
}: RegistrationsTableProps) => {
  if (loading) {
    return (
      <div className="flex justify-center my-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (registrations.length === 0) {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-lg font-medium mb-2">No registrations found</h3>
        <p className="text-muted-foreground">
          There are no event registrations matching your criteria.
        </p>
      </Card>
    );
  }
  
  return (
    <div className="bg-white rounded-md shadow overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Attendee</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Registration Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registrations.map((registration) => {
              // Safely get the profile properties
              const fullName = registration.profiles && 'full_name' in registration.profiles 
                ? registration.profiles.full_name 
                : 'Unknown';
                
              return (
                <TableRow key={registration.id}>
                  <TableCell className="font-medium">
                    <div>
                      <p>{fullName || 'Unknown'}</p>
                      {registration.phone_number && (
                        <p className="text-xs text-muted-foreground">{registration.phone_number}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{registration.events?.title || 'Unknown Event'}</TableCell>
                  <TableCell>{formatDate(registration.created_at)}</TableCell>
                  <TableCell>
                    <Badge variant={
                      registration.status === 'confirmed' ? 'default' : 
                      registration.status === 'cancelled' ? 'destructive' :
                      'secondary'
                    }>
                      {registration.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      registration.payment_status === 'confirmed' ? 'outline' : 
                      registration.payment_status === 'failed' ? 'destructive' :
                      'secondary'
                    }>
                      {registration.events?.is_free ? 'Free' : registration.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => onEdit(registration)}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => onDelete(registration)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RegistrationsTable;
