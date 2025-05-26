
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminEventEdit = () => {
  return (
    <AdminLayout title="Edit Event">
      <Card>
        <CardHeader>
          <CardTitle>Edit Event</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Admin event edit form will be implemented here.</p>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminEventEdit;
