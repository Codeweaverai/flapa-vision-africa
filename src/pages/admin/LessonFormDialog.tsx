import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, File, X, Sparkles, Loader2, BookOpen, Video, FileText, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { Lesson, createLesson, updateLesson } from "@/services/courseService";
import { transcribeLessonVideo } from "@/services/transcriptionService"; // Import the transcription service

export interface LessonFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: string;
  onLessonSaved: (lesson: Lesson) => void;
  editingLesson?: Lesson | null;
  courseId?: string;
}

const LessonFormDialog = ({
  open,
  onOpenChange,
  moduleId,
  onLessonSaved,
  editingLesson,
  courseId
}: LessonFormDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contentType, setContentType] = useState("video");
  const [videoUrl, setVideoUrl] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingMaterials, setUploadingMaterials] = useState(false);
  const [materialUrls, setMaterialUrls] = useState<string[]>([]);
  const [generateTranscript, setGenerateTranscript] = useState(true); // New state for transcript option
  const [transcribing, setTranscribing] = useState(false); // State for transcription progress

  useEffect(() => {
    if (editingLesson) {
      setTitle(editingLesson.title || "");
      setDescription(editingLesson.description || "");
      setContentType(editingLesson.content_type || "video");
      setVideoUrl(editingLesson.video_url || "");
      setContent(JSON.stringify(editingLesson.content) !== '{}' ? JSON.stringify(editingLesson.content) : "");
      setMaterialUrls(editingLesson.materials_urls || []);
    } else {
      resetForm();
    }
  }, [editingLesson, open]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setContentType("video");
    setVideoUrl("");
    setContent("");
    setMaterialUrls([]);
    setGenerateTranscript(true);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }

    if (file.size > 500 * 1024 * 1024) { // 500MB limit
      toast.error('Video file size must be less than 500MB');
      return;
    }

    setUploadingVideo(true);
    
    try {
      const { uploadFileWithFallback } = await import('@/services/wasabiService');
      
      const result = await uploadFileWithFallback(file, 'video');
      
      if (result.success && result.url) {
        setVideoUrl(result.url);
        const storageType = result.storage;
        toast.success(`Video uploaded successfully via ${storageType === 'wasabi' ? 'Wasabi' : 'Supabase fallback'}`);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      toast.error('Failed to upload video');
    } finally {
      setUploadingVideo(false);
    }
  };

  // Function to handle transcription after lesson creation/update
  const handleTranscription = async (lessonId: string) => {
    if (!videoUrl || !generateTranscript) return;

    setTranscribing(true);
    
    try {
      toast.info('Starting video transcription...', {
        duration: 3000,
      });

      const result = await transcribeLessonVideo(lessonId, videoUrl);
      
      if (result.success) {
        toast.success(`Transcription completed! Generated ${result.segmentCount} segments.`, {
          duration: 5000,
        });
      } else {
        toast.error(`Transcription failed: ${result.error}`, {
          duration: 5000,
        });
      }
    } catch (error: any) {
      console.error('Error in transcription process:', error);
      toast.error('Failed to transcribe video. Please try again later.');
    } finally {
      setTranscribing(false);
    }
  };

  const handleMaterialUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingMaterials(true);
    
    try {
      const { uploadFileWithFallback } = await import('@/services/wasabiService');
      
      const uploadPromises = Array.from(files).map(async (file) => {
        const result = await uploadFileWithFallback(file, 'material');
        
        if (result.success && result.url) {
          return result.url;
        } else {
          throw new Error(`Failed to upload ${file.name}: ${result.error}`);
        }
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setMaterialUrls(prev => [...prev, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} material(s) uploaded successfully`);
    } catch (error) {
      console.error('Error uploading materials:', error);
      toast.error('Failed to upload some materials');
    } finally {
      setUploadingMaterials(false);
    }
  };

  const removeMaterial = (urlToRemove: string) => {
    setMaterialUrls(prev => prev.filter(url => url !== urlToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Lesson title is required");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let lessonData;
      const lessonContent = content ? JSON.parse(content) : {};
      
      if (editingLesson) {
        lessonData = await updateLesson(editingLesson.id, {
          title,
          description: description || null,
          content_type: contentType,
          video_url: videoUrl || null,
          content: lessonContent,
          materials_urls: materialUrls
        });
        
        toast.success("Lesson updated successfully");
      } else {
        lessonData = await createLesson({
          module_id: moduleId,
          title,
          description: description || null,
          content_type: contentType,
          video_url: videoUrl || null,
          content: lessonContent,
          materials_urls: materialUrls,
          order_index: 0,
        });
        
        toast.success("Lesson created successfully");
      }
      
      if (lessonData) {
        onLessonSaved(lessonData);
        
        // Start transcription after saving the lesson
        if (videoUrl && generateTranscript) {
          setTimeout(() => {
            handleTranscription(lessonData.id);
          }, 1000); // Small delay to ensure lesson is saved
        }
        
        onOpenChange(false);
        resetForm();
      }
    } catch (error) {
      console.error("Error saving lesson:", error);
      toast.error("Failed to save lesson. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const GradientButton = ({ children, ...props }: any) => (
    <Button
      {...props}
      className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
    >
      {children}
    </Button>
  );

  const GradientIcon = () => (
    <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-2 rounded-lg">
      <BookOpen className="h-5 w-5 text-white" />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50/50 border-0 shadow-2xl">
        <DialogHeader className="space-y-4">
          <div className="flex items-center space-x-3">
            <GradientIcon />
            <DialogTitle className="bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent text-2xl font-bold">
              {editingLesson ? "Edit Lesson" : "Create New Lesson"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-lg text-gray-600">
            {editingLesson 
              ? "Update the details of this lesson" 
              : "Add a new lesson to your module"
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Card */}
          <Card className="border-l-4 border-l-orange-500 shadow-sm">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-semibold text-gray-700">
                    Lesson Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter an engaging lesson title..."
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what students will learn in this lesson..."
                    rows={2}
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contentType" className="text-sm font-semibold text-gray-700">
                    Content Type
                  </Label>
                  <Select 
                    value={contentType} 
                    onValueChange={setContentType}
                  >
                    <SelectTrigger id="contentType" className="border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                      <SelectValue placeholder="Select content type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video" className="flex items-center">
                        <Video className="h-4 w-4 mr-2" />
                        Video
                      </SelectItem>
                      <SelectItem value="text" className="flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        Text
                      </SelectItem>
                      <SelectItem value="mixed" className="flex items-center">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Mixed Content
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Content Section */}
          {(contentType === "video" || contentType === "mixed") && (
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center">
                    <Video className="h-4 w-4 mr-2 text-orange-500" />
                    Course Video
                  </Label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      disabled={uploadingVideo}
                      className="hidden"
                      id="video-upload"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => document.getElementById('video-upload')?.click()}
                      disabled={uploadingVideo}
                      className="border-orange-200 text-orange-600 hover:bg-orange-50"
                    >
                      {uploadingVideo ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading Video...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Video
                        </>
                      )}
                    </Button>
                    {videoUrl && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                        <File className="h-3 w-3 mr-1" />
                        Video uploaded
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Supported formats: MP4, MOV, AVI. Max size: 500MB
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Transcription Section - Only show if video is uploaded */}
          {videoUrl && (
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                    <Label className="text-sm font-semibold text-gray-700">
                      Video Transcription
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="generate-transcript"
                      checked={generateTranscript}
                      onChange={(e) => setGenerateTranscript(e.target.checked)}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <Label htmlFor="generate-transcript" className="text-sm text-gray-700 cursor-pointer">
                      Automatically generate transcript from video audio
                    </Label>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      When enabled, OpenAI's Whisper API will process your video audio to create:
                    </p>
                    <ul className="text-sm text-gray-600 mt-2 ml-4 list-disc space-y-1">
                      <li>Timed transcript segments</li>
                      <li>Searchable lesson content</li>
                      <li>Accessibility captions</li>
                      <li>Study materials</li>
                    </ul>
                    {transcribing && (
                      <div className="mt-3 flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        <span className="text-sm text-blue-600">Generating transcript...</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Text Content Section */}
          {(contentType === "text" || contentType === "mixed") && (
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <Label htmlFor="content" className="text-sm font-semibold text-gray-700 flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-purple-500" />
                    Lesson Content (JSON)
                  </Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder='{"blocks": [{"text": "Lesson content here"}]}'
                    rows={5}
                    className="border-gray-300 focus:border-purple-500 focus:ring-purple-500 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    Enter lesson content as JSON. For advanced editing options, use a structured editor.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Materials Section */}
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 flex items-center">
                  <File className="h-4 w-4 mr-2 text-blue-500" />
                  Course Materials & Assignments
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.zip"
                    onChange={handleMaterialUpload}
                    disabled={uploadingMaterials}
                    className="hidden"
                    id="materials-upload"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => document.getElementById('materials-upload')?.click()}
                    disabled={uploadingMaterials}
                    className="border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    {uploadingMaterials ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading Materials...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Materials
                      </>
                    )}
                  </Button>
                </div>
                
                {materialUrls.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <Label className="text-sm font-medium text-gray-700">Uploaded Materials:</Label>
                    <div className="space-y-2">
                      {materialUrls.map((url, index) => (
                        <div key={index} className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 p-3 rounded-lg border border-gray-200">
                          <div className="flex items-center space-x-2">
                            <File className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-700">
                              Material {index + 1}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMaterial(url)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <DialogFooter className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || transcribing}
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <GradientButton 
              type="submit" 
              disabled={isSubmitting || uploadingVideo || uploadingMaterials || transcribing}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {editingLesson ? 'Updating Lesson...' : 'Creating Lesson...'}
                </>
              ) : transcribing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {editingLesson ? 'Update Lesson' : 'Create Lesson'}
                </>
              )}
            </GradientButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LessonFormDialog;
