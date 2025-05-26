
import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdminCourseEdit = () => {
  return (
    <AdminLayout title="Edit Course">
      <Card>
        <CardHeader>
          <CardTitle>Edit Course</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Admin course edit form will be implemented here.</p>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminCourseEdit;
