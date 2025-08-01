
import React from 'react';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CreatorAttendeesPage = () => {
  return (
    <CreatorLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendee Management</h1>
          <p className="text-gray-600">Manage your event attendees</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Attendees</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Attendee management features coming soon...
            </p>
          </CardContent>
        </Card>
      </div>
    </CreatorLayout>
  );
};

export default CreatorAttendeesPage;
