
import React from 'react';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CreatorEventCreate = () => {
  return (
    <CreatorLayout title="Create Event">
      <Card>
        <CardHeader>
          <CardTitle>Create New Event</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Creator event creation form will be implemented here.</p>
        </CardContent>
      </Card>
    </CreatorLayout>
  );
};

export default CreatorEventCreate;
