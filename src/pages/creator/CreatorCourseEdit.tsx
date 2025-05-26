
import React from 'react';
import { useParams } from 'react-router-dom';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CreatorCourseEdit = () => {
  const { id } = useParams();

  return (
    <CreatorLayout title="Edit Course">
      <Card>
        <CardHeader>
          <CardTitle>Edit Course</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Course editing form for course {id} will be implemented here.</p>
        </CardContent>
      </Card>
    </CreatorLayout>
  );
};

export default CreatorCourseEdit;
