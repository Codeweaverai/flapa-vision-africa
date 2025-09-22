import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ImageIcon, X, Send, BookOpen, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { createCommunityPost } from '@/services/communityService';
import { uploadPostImage } from '@/services/communityImageService';
import { ImageUpload } from './ImageUpload';

interface Course {
  id: string;
  title: string;
  thumbnail_url?: string;
}

interface Event {
  id: string;
  title: string;
  image_url?: string;
  start_time: string;
}

interface EnhancedPostCreationProps {
  onPostCreated: () => void;
  courses?: Course[];
  events?: Event[];
  className?: string;
}

export const EnhancedPostCreation: React.FC<EnhancedPostCreationProps> = ({
  onPostCreated,
  courses = [],
  events = [],
  className = ''
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [associatedContent, setAssociatedContent] = useState<{
    type: 'none' | 'course' | 'event';
    id?: string;
  }>({ type: 'none' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to create a post');
      return;
    }

    if (!title.trim() || !content.trim()) {
      toast.error('Please provide both title and content');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the post first
      const postData: any = {
        user_id: user.id,
        title: title.trim(),
        content: content.trim()
      };

      // Add associated content if selected
      if (associatedContent.type === 'course' && associatedContent.id) {
        postData.course_id = associatedContent.id;
      }
      // Note: For events, we might need to add an event_id field to the community_posts table

      const newPost = await createCommunityPost(user.id, title.trim(), content.trim());

      if (!newPost) {
        throw new Error('Failed to create post');
      }

      // Upload images if any
      if (selectedImages.length > 0) {
        const uploadPromises = selectedImages.map((file, index) =>
          uploadPostImage(newPost.id, file, index, `Image ${index + 1}`)
        );

        const uploadResults = await Promise.all(uploadPromises);
        const failedUploads = uploadResults.filter(result => !result.success);
        
        if (failedUploads.length > 0) {
          toast.warning(`${failedUploads.length} images failed to upload`);
        }
      }

      // Reset form
      setTitle('');
      setContent('');
      setSelectedImages([]);
      setAssociatedContent({ type: 'none' });
      
      toast.success('Post created successfully!');
      onPostCreated();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAssociatedContentDisplay = () => {
    if (associatedContent.type === 'course' && associatedContent.id) {
      const course = courses.find(c => c.id === associatedContent.id);
      return course ? (
        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
          <BookOpen className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-blue-800">Course: {course.title}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-blue-600 hover:bg-blue-100"
            onClick={() => setAssociatedContent({ type: 'none' })}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : null;
    }

    if (associatedContent.type === 'event' && associatedContent.id) {
      const event = events.find(e => e.id === associatedContent.id);
      return event ? (
        <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
          <Calendar className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-800">Event: {event.title}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-green-600 hover:bg-green-100"
            onClick={() => setAssociatedContent({ type: 'none' })}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : null;
    }

    return null;
  };

  if (!user) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-gray-600">Please sign in to create posts</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5 text-orange-600" />
          Create New Post
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title Input */}
          <div>
            <Input
              placeholder="What's on your mind?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              className="text-lg font-medium"
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {title.length}/200
            </div>
          </div>

          {/* Content Input */}
          <div>
            <Textarea
              placeholder="Share your thoughts, experiences, or ask questions..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              maxLength={2000}
              className="resize-none"
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {content.length}/2000
            </div>
          </div>

          {/* Associated Content Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Associate with content (optional)
            </label>
            <Select
              value={associatedContent.type === 'none' ? '' : `${associatedContent.type}-${associatedContent.id}`}
              onValueChange={(value) => {
                if (!value) {
                  setAssociatedContent({ type: 'none' });
                } else {
                  const [type, id] = value.split('-');
                  setAssociatedContent({ type: type as 'course' | 'event', id });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select course or event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {courses.length > 0 && (
                  <>
                    <SelectItem value="" disabled className="font-semibold">
                      Courses
                    </SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={`course-${course.id}`}>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          {course.title}
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
                {events.length > 0 && (
                  <>
                    <SelectItem value="" disabled className="font-semibold">
                      Events
                    </SelectItem>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={`event-${event.id}`}>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {event.title}
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>

            {getAssociatedContentDisplay()}
          </div>

          {/* Image Upload */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Add Images (optional)
            </label>
            <ImageUpload
              onImagesSelected={setSelectedImages}
              maxImages={4}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Create Post
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};