
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Eye, Trash2 } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { RegistrationEditDialog } from './RegistrationEditDialog';

export interface RegistrationItem {
  id: string;
  user_id: string;
  entity_id: string;
  entity_title: string;
  entity_type: 'course' | 'event';
  user_name: string;
  user_email: string;
  created_at: string;
  status: string;
  payment_status: string;
  payment_amount: number | null;
  payment_currency: string | null;
  payment_method: string | null;
  type: string;
}

interface CombinedRegistration extends RegistrationItem {
  event_id?: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface RegistrationsTableProps {
  registrations: RegistrationItem[];
  onEdit?: (registration: RegistrationItem) => void;
  onDelete?: (id: string) => void;
  onView?: (registration: RegistrationItem) => void;
}

const RegistrationsTable: React.FC<RegistrationsTableProps> = ({
  registrations,
  onEdit,
  onDelete,
  onView,
}) => {
  const [selectedRegistration, setSelectedRegistration] = useState<CombinedRegistration | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'refunded':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEdit = (registration: RegistrationItem) => {
    const combinedRegistration: CombinedRegistration = {
      ...registration,
      event_id: registration.entity_type === 'event' ? registration.entity_id : undefined,
      user: {
        id: registration.user_id,
        full_name: registration.user_name,
        email: registration.user_email,
      },
    };
    setSelectedRegistration(combinedRegistration);
    setIsEditDialogOpen(true);
  };

  const handleSave = (updatedData: any) => {
    console.log('Saving registration data:', updatedData);
    setIsEditDialogOpen(false);
    setSelectedRegistration(null);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment Status</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {registrations.map((registration) => (
            <TableRow key={registration.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{registration.user_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {registration.user_email}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {registration.entity_type}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">
                {registration.entity_title}
              </TableCell>
              <TableCell>
                {formatDateTime(registration.created_at)}
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(registration.status)}>
                  {registration.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={getPaymentStatusColor(registration.payment_status)}>
                  {registration.payment_status}
                </Badge>
              </TableCell>
              <TableCell>
                {registration.payment_amount && registration.payment_currency ? (
                  `${registration.payment_currency} ${registration.payment_amount}`
                ) : (
                  'Free'
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {onView && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(registration)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(registration)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(registration.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedRegistration && (
        <RegistrationEditDialog
          isOpen={isEditDialogOpen}
          registration={selectedRegistration}
          onClose={() => {
            setIsEditDialogOpen(false);
            setSelectedRegistration(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default RegistrationsTable;
