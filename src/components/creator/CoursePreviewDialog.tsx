
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Upload, Play } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

interface CoursePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: {
    id: string;
    title: string;
    description: string;
    summary: string;
    thumbnail_url?: string;
    is_published: boolean;
    is_free: boolean;
    price: number;
    duration_minutes: number;
    category: string;
    difficulty_level: string;
    created_at: string;
  } | null;
  onPreviewAdded: () => Promise<void>;
}

interface LearningOutcome {
  id?: string;
  outcome: string;
  order_index: number;
}

const CoursePreviewDialog: React.FC<CoursePreviewDialogProps> = ({
  open,
  onOpenChange,
  course,
  onPreviewAdded
}) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [learningOutcomes, setLearningOutcomes] = useState<LearningOutcome[]>([]);
  const [previewVideoUrl, setPreviewVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);

  useEffect(() => {
    if (open && course) {
      loadExistingData();
    }
  }, [open, course]);

  const loadExistingData = async () => {
    if (!course) return;
    
    setLoading(true);
    try {
      // Load learning outcomes
      const { data: outcomes, error: outcomesError } = await supabase
        .from('course_learning_outcomes')
        .select('*')
        .eq('course_id', course.id)
        .order('order_index');

      if (outcomesError) throw outcomesError;

      // Load preview video
      const { data: preview, error: previewError } = await supabase
        .from('course_previews')
        .select('*')
        .eq('course_id', course.id)
        .single();

      if (previewError && previewError.code !== 'PGRST116') throw previewError;

      setLearningOutcomes(outcomes || []);
      setPreviewVideoUrl(preview?.preview_video_url || '');
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load existing data');
    } finally {
      setLoading(false);
    }
  };

  const addLearningOutcome = () => {
    setLearningOutcomes([
      ...learningOutcomes,
      { outcome: '', order_index: learningOutcomes.length }
    ]);
  };

  const updateLearningOutcome = (index: number, outcome: string) => {
    const updated = [...learningOutcomes];
    updated[index].outcome = outcome;
    setLearningOutcomes(updated);
  };

  const removeLearningOutcome = (index: number) => {
    setLearningOutcomes(learningOutcomes.filter((_, i) => i !== index));
  };

  const handleVideoUpload = async () => {
    if (!videoFile || !course) return null;

    setUploading(true);
    try {
      const fileExt = videoFile.name.split('.').pop();
      const fileName = `${course.id}/preview_${uuidv4()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('course-videos')
        .upload(fileName, videoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('course-videos')
        .getPublicUrl(fileName);

      return { url: publicUrl, path: fileName };
    } catch (error) {
      console.error('Error uploading video:', error);
      toast.error('Failed to upload video');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!course) return;
    
    setLoading(true);
    try {
      // Upload video if new file selected
      let videoData = { url: previewVideoUrl, path: '' };
      if (videoFile) {
        const uploadResult = await handleVideoUpload();
        if (uploadResult) {
          videoData = uploadResult;
        }
      }

      // Save preview data
      const { error: previewError } = await supabase
        .from('course_previews')
        .upsert({
          course_id: course.id,
          preview_video_url: videoData.url,
          preview_video_path: videoData.path
        });

      if (previewError) throw previewError;

      // Delete existing learning outcomes
      await supabase
        .from('course_learning_outcomes')
        .delete()
        .eq('course_id', course.id);

      // Save learning outcomes
      if (learningOutcomes.length > 0) {
        const outcomesToSave = learningOutcomes
          .filter(outcome => outcome.outcome.trim())
          .map((outcome, index) => ({
            course_id: course.id,
            outcome: outcome.outcome.trim(),
            order_index: index
          }));

        if (outcomesToSave.length > 0) {
          const { error: outcomesError } = await supabase
            .from('course_learning_outcomes')
            .insert(outcomesToSave);

          if (outcomesError) throw outcomesError;
        }
      }

      toast.success('Course preview updated successfully!');
      onOpenChange(false);
      await onPreviewAdded();
    } catch (error) {
      console.error('Error saving preview:', error);
      toast.error('Failed to save course preview');
    } finally {
      setLoading(false);
    }
  };

  if (!course) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Course Preview & Learning Outcomes</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Video Upload Section */}
          <div>
            <Label className="text-base font-medium">Preview Video</Label>
            <div className="mt-2 space-y-4">
              {previewVideoUrl && (
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <video 
                    src={previewVideoUrl} 
                    controls 
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  className="flex-1"
                />
                {videoFile && (
                  <span className="text-sm text-muted-foreground">
                    {videoFile.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Learning Outcomes Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-base font-medium">What You'll Learn</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addLearningOutcome}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Outcome
              </Button>
            </div>

            <div className="space-y-3">
              {learningOutcomes.map((outcome, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={outcome.outcome}
                    onChange={(e) => updateLearningOutcome(index, e.target.value)}
                    placeholder={`Learning outcome ${index + 1}`}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLearningOutcome(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading || uploading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={loading || uploading}
            >
              {loading || uploading ? 'Saving...' : 'Save Preview'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CoursePreviewDialog;
