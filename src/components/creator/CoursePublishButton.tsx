
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface CoursePublishButtonProps {
  courseId: string;
  isPublished: boolean;
  onStatusChange: (newStatus: boolean) => void;
}

const CoursePublishButton: React.FC<CoursePublishButtonProps> = ({
  courseId,
  isPublished,
  onStatusChange
}) => {
  const [loading, setLoading] = useState(false);

  const togglePublishStatus = async () => {
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_published: !isPublished })
        .eq('id', courseId);

      if (error) throw error;

      onStatusChange(!isPublished);
      toast.success(
        !isPublished 
          ? 'Course published successfully!' 
          : 'Course unpublished successfully!'
      );
    } catch (error) {
      console.error('Error updating course status:', error);
      toast.error('Failed to update course status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Badge 
        variant={isPublished ? "default" : "secondary"}
        className={isPublished ? "bg-green-500" : "bg-gray-500"}
      >
        {isPublished ? 'Published' : 'Draft'}
      </Badge>
      
      <Button
        onClick={togglePublishStatus}
        disabled={loading}
        variant={isPublished ? "outline" : "default"}
        size="sm"
        className={
          isPublished 
            ? "border-orange-300 text-orange-600 hover:bg-orange-50" 
            : "bg-green-600 hover:bg-green-700"
        }
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : isPublished ? (
          <EyeOff className="h-4 w-4 mr-2" />
        ) : (
          <Eye className="h-4 w-4 mr-2" />
        )}
        {loading ? 'Updating...' : isPublished ? 'Unpublish' : 'Publish'}
      </Button>
    </div>
  );
};

export default CoursePublishButton;
