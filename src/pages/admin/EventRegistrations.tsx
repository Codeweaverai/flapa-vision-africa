
import React from 'react';
import { useParams } from 'react-router-dom';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const EventRegistrations = () => {
  const { id } = useParams();

  return (
    <AdminLayout>
      <Card>
        <CardHeader>
          <CardTitle>Event Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Event registrations for event {id} will be displayed here.</p>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default EventRegistrations;
