
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminCourseCreate = () => {
  return (
    <AdminLayout title="Create Course">
      <Card>
        <CardHeader>
          <CardTitle>Create New Course</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Admin course creation form will be implemented here.</p>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminCourseCreate;
