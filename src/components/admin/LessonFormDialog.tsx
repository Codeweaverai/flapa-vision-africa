
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { createLesson, updateLesson } from "@/services/courseService";
import { uploadFileToWasabi, getVideoMetadata } from "@/services/wasabiService";
import { Lesson } from "@/services/courseService";
import { FileUpload, Upload } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface LessonFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: string;
  onLessonSaved: (lesson: Lesson) => void;
  editingLesson?: Lesson | null;
  lessons: Lesson[];
  courseId: string;
}

const LessonFormDialog = ({
  open,
  onOpenChange,
  moduleId,
  onLessonSaved,
  editingLesson,
  lessons,
  courseId
}: LessonFormDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("30");
  const [addQuiz, setAddQuiz] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Video upload related states
  const [videoTab, setVideoTab] = useState<string>("youtube");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [videoMetadata, setVideoMetadata] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingLesson) {
      setTitle(editingLesson.title);
      setDescription(editingLesson.description || "");
      setVideoUrl(editingLesson.video_url || "");
      // We would set estimated minutes here if it was in the database
      
      // Load any existing video metadata
      const loadVideoMetadata = async () => {
        const metadata = await getVideoMetadata(editingLesson.id);
        if (metadata) {
          setVideoMetadata(metadata);
          setVideoTab("upload");
        } else if (editingLesson.video_url) {
          setVideoTab("youtube");
        }
      };
      
      loadVideoMetadata();
    } else {
      setTitle("");
      setDescription("");
      setVideoUrl("");
      setEstimatedMinutes("30");
      setAddQuiz(false);
      setSelectedFile(null);
      setVideoMetadata(null);
      setVideoTab("youtube");
    }
  }, [editingLesson, open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Check if the file is a video
      if (!file.type.startsWith('video/')) {
        toast.error("Please select a valid video file");
        return;
      }
      
      // Check if the file size is below 1GB (1024 * 1024 * 1024 bytes)
      if (file.size > 1024 * 1024 * 1024) {
        toast.error("File size exceeds 1GB limit");
        return;
      }
      
      setSelectedFile(file);
    }
  };
  
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 500);
      
      // In a real implementation, this would use a pre-signed URL or backend function
      // For this simulation, we'll just save the metadata
      const tempLessonId = editingLesson ? editingLesson.id : 'temp-id';
      
      // Upload the file to Wasabi
      const metadata = await uploadFileToWasabi(selectedFile, tempLessonId);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (metadata) {
        setVideoMetadata(metadata);
        toast.success("Video uploaded successfully");
      } else {
        throw new Error("Failed to upload video");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload video");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Lesson title is required");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Determine video content
      let videoData = null;
      
      if (videoTab === "youtube") {
        videoData = { youtube_url: videoUrl };
      } else if (videoTab === "upload" && videoMetadata) {
        videoData = { 
          wasabi_url: videoMetadata.wasabi_url,
          metadata_id: videoMetadata.id
        };
      }
      
      const lessonData = {
        module_id: moduleId,
        title,
        description: description || null,
        video_url: videoTab === "youtube" ? videoUrl : null,
        order_index: editingLesson ? editingLesson.order_index : lessons.length,
        content_type: 'video',
        content: videoData || {}
      };
      
      let savedLesson;
      
      if (editingLesson) {
        // Update existing lesson
        savedLesson = await updateLesson(editingLesson.id, lessonData);
        
        toast.success("The lesson has been updated successfully");
      } else {
        // Create new lesson
        savedLesson = await createLesson(lessonData);
        
        toast.success("New lesson has been created successfully");
        
        // If add quiz was toggled, we would handle quiz creation here
        if (addQuiz) {
          toast.success("You can now add a quiz for this lesson");
        }
      }
      
      // If we have a temporary lesson ID and now have a real one,
      // update the video metadata with the real lesson ID
      if (savedLesson && videoMetadata && editingLesson === null) {
        // In a real implementation, update the metadata with the actual lesson ID
        console.log(`Would update video metadata for ${videoMetadata.id} with lesson ID ${savedLesson.id}`);
      }
      
      if (savedLesson) {
        onLessonSaved(savedLesson);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error saving lesson:", error);
      toast.error("Failed to save the lesson. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {editingLesson ? "Edit Lesson" : "Create New Lesson"}
          </DialogTitle>
          <DialogDescription>
            {editingLesson 
              ? "Update the details of this lesson" 
              : "Add a new lesson to your module"
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Lesson Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter lesson title"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter lesson description"
              rows={3}
            />
          </div>
          
          <div className="space-y-4">
            <Label>Lesson Video</Label>
            <Tabs value={videoTab} onValueChange={setVideoTab} defaultValue="youtube">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="youtube">YouTube URL</TabsTrigger>
                <TabsTrigger value="upload">Upload Video</TabsTrigger>
              </TabsList>
              
              <TabsContent value="youtube" className="space-y-2">
                <Input
                  id="videoUrl"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <p className="text-xs text-muted-foreground">
                  Enter the full YouTube URL for the lesson video
                </p>
              </TabsContent>
              
              <TabsContent value="upload" className="space-y-4">
                {!videoMetadata ? (
                  <>
                    <div className="border border-dashed border-gray-300 rounded-md p-6 text-center">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="video/*"
                        className="hidden"
                      />
                      {selectedFile ? (
                        <div className="space-y-2">
                          <p className="font-medium truncate">{selectedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                          
                          {isUploading ? (
                            <div className="space-y-2">
                              <Progress value={uploadProgress} className="h-2" />
                              <p className="text-sm text-muted-foreground">
                                Uploading... {uploadProgress.toFixed(0)}%
                              </p>
                            </div>
                          ) : (
                            <Button 
                              type="button" 
                              onClick={handleUpload} 
                              disabled={isUploading}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Video
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div
                          className="flex flex-col items-center justify-center cursor-pointer py-4"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <FileUpload className="h-10 w-10 text-muted-foreground mb-2" />
                          <p className="font-medium">Click to select a video</p>
                          <p className="text-sm text-muted-foreground">MP4, WebM or MOV up to 1GB</p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Upload your video file directly. Supported formats: MP4, WebM, MOV.
                    </p>
                  </>
                ) : (
                  <div className="border rounded-md p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Video uploaded successfully</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {videoMetadata.original_filename || "Uploaded video"}
                        </p>
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setVideoMetadata(null);
                          setSelectedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                      >
                        Change
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="estimatedMinutes">Estimated Completion Time (minutes)</Label>
            <Input
              id="estimatedMinutes"
              type="number"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
              min="1"
              max="300"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="addQuiz"
              checked={addQuiz}
              onCheckedChange={setAddQuiz}
            />
            <Label htmlFor="addQuiz">Add Quiz to this Lesson</Label>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || isUploading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || isUploading || (videoTab === "upload" && !videoMetadata)}
            >
              {isSubmitting ? 
                "Saving..." : 
                editingLesson ? "Update Lesson" : "Create Lesson"
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LessonFormDialog;
