import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, File, X, Sparkles, Loader2, BookOpen, Video, FileText, MessageSquare, Captions } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { Lesson, createLesson, updateLesson } from "@/services/courseService";
import { transcribeLessonVideo, getLessonTranscript } from "@/services/transcriptionService";
import LessonTranscriptViewer from './LessonTranscriptViewer'; // We'll create this

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
  const [transcribing, setTranscribing] = useState(false);
  const [showTranscriptViewer, setShowTranscriptViewer] = useState(false);
  const [transcriptSegments, setTranscriptSegments] = useState<any[]>([]);
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [hasTranscript, setHasTranscript] = useState(false);

  useEffect(() => {
    if (editingLesson) {
      setTitle(editingLesson.title || "");
      setDescription(editingLesson.description || "");
      setContentType(editingLesson.content_type || "video");
      setVideoUrl(editingLesson.video_url || "");
      setContent(JSON.stringify(editingLesson.content) !== '{}' ? JSON.stringify(editingLesson.content) : "");
      setMaterialUrls(editingLesson.materials_urls || []);
      
      // Check if lesson has transcript
      if (editingLesson.id) {
        checkTranscriptExists(editingLesson.id);
      }
    } else {
      resetForm();
    }
  }, [editingLesson, open]);

  const checkTranscriptExists = async (lessonId: string) => {
    try {
      const { data, error } = await supabase
        .from('lesson_transcripts')
        .select('id')
        .eq('lesson_id', lessonId)
        .limit(1);

      if (!error && data && data.length > 0) {
        setHasTranscript(true);
      } else {
        setHasTranscript(false);
      }
    } catch (error) {
      console.error('Error checking transcript:', error);
      setHasTranscript(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setContentType("video");
    setVideoUrl("");
    setContent("");
    setMaterialUrls([]);
    setTranscribing(false);
    setHasTranscript(false);
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
        toast.success(`Video uploaded successfully via ${storageType === 'wasabi' ? 'Wasabi' : 'skillpulse'}`);
        
        // Auto-enable transcript generation for new uploads
        if (!editingLesson) {
          toast.info('Ready to generate transcript for this video', {
            action: {
              label: 'Generate Now',
              onClick: () => handleGenerateTranscript()
            }
          });
        }
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

  const handleGenerateTranscript = async () => {
    if (!videoUrl) {
      toast.error('Please upload a video first');
      return;
    }

    if (!editingLesson?.id) {
      toast.error('Please save the lesson first before generating transcript');
      return;
    }

    setTranscribing(true);
    
    try {
      toast.info('Starting video transcription...', {
        id: 'transcript-start',
        duration: 3000,
      });

      const result = await transcribeLessonVideo(editingLesson.id, videoUrl);
      
      if (result.success) {
        toast.success(`Transcription completed! Generated ${result.segmentCount} segments.`, {
          duration: 5000,
        });
        setHasTranscript(true);
        
        // Show option to view transcript
        toast('Transcript ready!', {
          description: 'Your video transcript has been generated.',
          action: {
            label: 'View Transcript',
            onClick: () => handleViewTranscript()
          },
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

  const handleViewTranscript = async () => {
    if (!editingLesson?.id) {
      toast.error('No lesson selected');
      return;
    }

    setLoadingTranscript(true);
    setShowTranscriptViewer(true);
    
    try {
      const segments = await getLessonTranscript(editingLesson.id);
      setTranscriptSegments(segments);
      
      if (segments.length === 0) {
        toast.info('No transcript found. Generate one first.');
      }
    } catch (error) {
      console.error('Error loading transcript:', error);
      toast.error('Failed to load transcript');
    } finally {
      setLoadingTranscript(false);
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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50/50 border-0 shadow-2xl">
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
                    
                    {/* Transcript Actions */}
                    {videoUrl && editingLesson?.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center mb-2">
                          <Captions className="h-4 w-4 mr-2 text-blue-500" />
                          Video Transcription
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateTranscript}
                            disabled={transcribing || !editingLesson?.id}
                            className="border-blue-200 text-blue-600 hover:bg-blue-50"
                          >
                            {transcribing ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Transcribing...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-3 w-3 mr-1" />
                                Generate Transcript
                              </>
                            )}
                          </Button>
                          
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleViewTranscript}
                            disabled={!hasTranscript}
                            className="border-green-200 text-green-600 hover:bg-green-50"
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            View Transcript
                          </Button>
                          
                          {hasTranscript && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Transcript Available
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Generate a transcript to make your video content accessible and searchable.
                        </p>
                      </div>
                    )}
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

      {/* Transcript Viewer Dialog */}
      <Dialog open={showTranscriptViewer} onOpenChange={setShowTranscriptViewer}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] bg-gradient-to-br from-white to-blue-50/50 border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-2xl">
              <MessageSquare className="h-6 w-6 mr-2 text-blue-500" />
              Lesson Transcript
              {editingLesson && (
                <span className="ml-2 text-lg font-normal text-gray-600">
                  - {editingLesson.title}
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              View and manage the transcript for this lesson video
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[60vh] overflow-y-auto pr-2">
            {loadingTranscript ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mr-3" />
                <span className="text-gray-600">Loading transcript...</span>
              </div>
            ) : transcriptSegments.length > 0 ? (
              <div className="space-y-4">
                {transcriptSegments.map((segment, index) => (
                  <Card key={segment.id} className="border-l-4 border-l-blue-500 hover:border-l-blue-600 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {formatTime(segment.start_time)} - {formatTime(segment.end_time)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            navigator.clipboard.writeText(segment.text);
                            toast.success('Copied to clipboard');
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{segment.text}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No transcript found</h3>
                <p className="text-gray-500 mb-6">
                  This lesson doesn't have a transcript yet. Generate one from the video.
                </p>
                {editingLesson?.id && videoUrl && (
                  <Button onClick={handleGenerateTranscript} disabled={transcribing}>
                    {transcribing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Transcript
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
          
          {transcriptSegments.length > 0 && (
            <DialogFooter className="pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center w-full">
                <div className="text-sm text-gray-500">
                  {transcriptSegments.length} segments • Total duration: {formatTime(transcriptSegments[transcriptSegments.length - 1]?.end_time || 0)}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const transcriptText = transcriptSegments.map(segment => 
                        `[${formatTime(segment.start_time)} - ${formatTime(segment.end_time)}]\n${segment.text}\n`
                      ).join('\n');
                      
                      const blob = new Blob([transcriptText], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `transcript-${editingLesson?.title || 'lesson'}.txt`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      
                      toast.success('Transcript exported successfully');
                    }}
                  >
                    Export as TXT
                  </Button>
                  <Button onClick={() => setShowTranscriptViewer(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

// Helper function to format time
const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default LessonFormDialog;
