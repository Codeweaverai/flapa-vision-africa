
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const EventRegistrations = () => {
  return (
    <AdminLayout title="Event Registrations">
      <Card>
        <CardHeader>
          <CardTitle>Event Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Event registrations management will be implemented here.</p>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default EventRegistrations;
