import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Upload, Play, Star } from 'lucide-react';
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

interface SkillOutcome {
  id?: string;
  skill_name: string;
  skill_description: string;
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  order_index: number;
  is_core_skill: boolean;
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
  const [skillOutcomes, setSkillOutcomes] = useState<SkillOutcome[]>([]);
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

      // Load skill outcomes
      const { data: skills, error: skillsError } = await supabase
        .from('course_skill_outcomes')
        .select('*')
        .eq('course_id', course.id)
        .order('order_index');

      if (skillsError) throw skillsError;

      // Load preview video
      const { data: preview, error: previewError } = await supabase
        .from('course_previews')
        .select('*')
        .eq('course_id', course.id)
        .single();

      if (previewError && previewError.code !== 'PGRST116') throw previewError;

      setLearningOutcomes(outcomes || []);
      setSkillOutcomes(skills || []);
      setPreviewVideoUrl(preview?.preview_video_url || '');
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load existing data');
    } finally {
      setLoading(false);
    }
  };

  // Learning Outcomes Functions
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

  // Skill Outcomes Functions
  const addSkillOutcome = () => {
    setSkillOutcomes([
      ...skillOutcomes,
      { 
        skill_name: '', 
        skill_description: '', 
        skill_level: 'intermediate', 
        order_index: skillOutcomes.length,
        is_core_skill: true 
      }
    ]);
  };

  const updateSkillOutcome = (index: number, field: keyof SkillOutcome, value: any) => {
    const updated = [...skillOutcomes];
    updated[index] = { ...updated[index], [field]: value };
    setSkillOutcomes(updated);
  };

  const removeSkillOutcome = (index: number) => {
    setSkillOutcomes(skillOutcomes.filter((_, i) => i !== index));
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

      // Check if preview already exists and use upsert with proper conflict handling
      const { data: existingPreview, error: checkError } = await supabase
        .from('course_previews')
        .select('id')
        .eq('course_id', course.id)
        .single();

      let previewError;
      
      if (existingPreview) {
        // Update existing preview
        const { error } = await supabase
          .from('course_previews')
          .update({
            preview_video_url: videoData.url,
            preview_video_path: videoData.path,
            updated_at: new Date().toISOString()
          })
          .eq('course_id', course.id);
        previewError = error;
      } else {
        // Insert new preview
        const { error } = await supabase
          .from('course_previews')
          .insert({
            course_id: course.id,
            preview_video_url: videoData.url,
            preview_video_path: videoData.path
          });
        previewError = error;
      }

      if (previewError) throw previewError;

      // Delete existing learning outcomes
      const { error: deleteOutcomesError } = await supabase
        .from('course_learning_outcomes')
        .delete()
        .eq('course_id', course.id);

      if (deleteOutcomesError) throw deleteOutcomesError;

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

      // Delete existing skill outcomes
      const { error: deleteSkillsError } = await supabase
        .from('course_skill_outcomes')
        .delete()
        .eq('course_id', course.id);

      if (deleteSkillsError) throw deleteSkillsError;

      // Save skill outcomes
      if (skillOutcomes.length > 0) {
        const skillsToSave = skillOutcomes
          .filter(skill => skill.skill_name.trim())
          .map((skill, index) => ({
            course_id: course.id,
            skill_name: skill.skill_name.trim(),
            skill_description: skill.skill_description.trim(),
            skill_level: skill.skill_level,
            order_index: index,
            is_core_skill: skill.is_core_skill
          }));

        if (skillsToSave.length > 0) {
          const { error: skillsError } = await supabase
            .from('course_skill_outcomes')
            .insert(skillsToSave);

          if (skillsError) throw skillsError;
        }
      }

      toast.success('Course preview and outcomes updated successfully!');
      onOpenChange(false);
      await onPreviewAdded();
    } catch (error: any) {
      console.error('Error saving preview:', error);
      
      // More specific error messages
      if (error.code === '23505') {
        toast.error('This course already has a preview. Please try again.');
      } else if (error.message?.includes('duplicate key')) {
        toast.error('Duplicate entry detected. Please try refreshing the page.');
      } else {
        toast.error('Failed to save course preview. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!course) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Course Preview & Outcomes</DialogTitle>
          <DialogDescription>
            Add a preview video and define what students will learn and what skills they'll gain from this course.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8">
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
              <p className="text-sm text-muted-foreground">
                Upload a short video that gives students a preview of your course content.
              </p>
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
                Add Learning Outcome
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
              {learningOutcomes.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No learning outcomes added yet. Click "Add Learning Outcome" to get started.
                </p>
              )}
            </div>
          </div>

          {/* Skill Outcomes Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-base font-medium">Skills You'll Gain</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addSkillOutcome}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Skill Outcome
              </Button>
            </div>

            <div className="space-y-4">
              {skillOutcomes.map((skill, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Input
                        value={skill.skill_name}
                        onChange={(e) => updateSkillOutcome(index, 'skill_name', e.target.value)}
                        placeholder="Skill name (e.g., Python Programming)"
                        className="w-64"
                      />
                      <Select
                        value={skill.skill_level}
                        onValueChange={(value: 'beginner' | 'intermediate' | 'advanced' | 'expert') => 
                          updateSkillOutcome(index, 'skill_level', value)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`core-skill-${index}`}
                          checked={skill.is_core_skill}
                          onChange={(e) => updateSkillOutcome(index, 'is_core_skill', e.target.checked)}
                          className="w-4 h-4"
                        />
                        <Label htmlFor={`core-skill-${index}`} className="text-sm flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          Core Skill
                        </Label>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSkillOutcome(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <Textarea
                    value={skill.skill_description}
                    onChange={(e) => updateSkillOutcome(index, 'skill_description', e.target.value)}
                    placeholder="Describe what students will be able to do with this skill..."
                    className="resize-none"
                    rows={2}
                  />
                </div>
              ))}
              {skillOutcomes.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No skill outcomes added yet. Click "Add Skill Outcome" to define the skills students will gain.
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
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
              className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
            >
              {loading || uploading ? 'Saving...' : 'Save All Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CoursePreviewDialog;
