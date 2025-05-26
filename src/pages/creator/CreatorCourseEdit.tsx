
import React from 'react';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CreatorCourseEdit = () => {
  return (
    <CreatorLayout title="Edit Course">
      <Card>
        <CardHeader>
          <CardTitle>Edit Course</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Creator course edit form will be implemented here.</p>
        </CardContent>
      </Card>
    </CreatorLayout>
  );
};

export default CreatorCourseEdit;
