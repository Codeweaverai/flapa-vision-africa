
import React from 'react';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CreatorCourseCreate = () => {
  return (
    <CreatorLayout title="Create Course">
      <Card>
        <CardHeader>
          <CardTitle>Create New Course</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Creator course creation form will be implemented here.</p>
        </CardContent>
      </Card>
    </CreatorLayout>
  );
};

export default CreatorCourseCreate;
