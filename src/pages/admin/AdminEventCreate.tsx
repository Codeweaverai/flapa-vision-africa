
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminEventCreate = () => {
  return (
    <AdminLayout title="Create Event">
      <Card>
        <CardHeader>
          <CardTitle>Create New Event</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Admin event creation form will be implemented here.</p>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminEventCreate;
