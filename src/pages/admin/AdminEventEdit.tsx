
import React from 'react';
import { useParams } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminEventEdit = () => {
  const { id } = useParams();

  return (
    <AdminLayout>
      <Card>
        <CardHeader>
          <CardTitle>Edit Event</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Event editing form for event {id} will be implemented here.</p>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminEventEdit;
