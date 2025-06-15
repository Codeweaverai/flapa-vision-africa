
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Save, Upload, Video } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import FileUpload from '@/components/common/FileUpload';
import { createMediaPost } from '@/services/mediaService';

interface VideoPodcastFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const VideoPodcastForm: React.FC<VideoPodcastFormProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    guestName: '',
    recordingDate: undefined as Date | undefined,
    description: '',
    tags: '',
    videoUrl: '',
    episodeNumber: '',
    category: '',
    publishStatus: 'draft' as 'draft' | 'scheduled' | 'published',
    scheduleDate: undefined as Date | undefined,
    coverImageUrl: ''
  });
  const [videoFile, setVideoFile] = useState<File | undefined>();
  const [coverImageFile, setCoverImageFile] = useState<File | undefined>();
  const [loading, setLoading] = useState(false);

  const seriesOptions = [
    { value: 'techtalkafrica', label: 'TechTalk Africa' },
    { value: 'founderstories', label: 'Founder Stories' },
    { value: 'skillpulseweekly', label: 'SkillPulse Weekly' },
    { value: 'aiinsights', label: 'AI Insights' },
    { value: 'womenintech', label: 'Women in Tech' }
  ];

  const tagOptions = [
    'Tech Startups', 'AI in Africa', 'Entrepreneurship', 'Digital Skills', 
    'Women in Tech', 'Innovation', 'Funding', 'Leadership', 'Business Strategy'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.videoUrl && !videoFile) {
      toast.error('Please provide either a video URL or upload a video file');
      return;
    }

    setLoading(true);
    try {
      // Prepare the podcast content with structured data
      const podcastContent = `
**Guest:** ${formData.guestName}
**Recording Date:** ${formData.recordingDate ? format(formData.recordingDate, 'MMMM d, yyyy') : 'Not specified'}
${formData.episodeNumber ? `**Episode:** ${formData.episodeNumber}` : ''}
${formData.category ? `**Series:** ${seriesOptions.find(s => s.value === formData.category)?.label || formData.category}` : ''}

**Description:**
${formData.description}

${formData.tags ? `**Topics:** ${formData.tags}` : ''}
      `.trim();

      const postData = {
        title: formData.title,
        content: podcastContent,
        summary: formData.description.substring(0, 200) + (formData.description.length > 200 ? '...' : ''),
        post_type: 'podcast' as const,
        category: 'podcast',
        media_url: formData.videoUrl || undefined,
        duration_minutes: undefined, // Will be set after video analysis if needed
        is_published: formData.publishStatus === 'published'
      };

      const result = await createMediaPost(postData, coverImageFile, videoFile);
      
      if (result) {
        toast.success('Video podcast created successfully!');
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error('Error creating video podcast:', error);
      toast.error('Failed to create video podcast');
    } finally {
      setLoading(false);
    }
  };

  const handleCoverImageUpload = (url: string, path: string) => {
    setFormData(prev => ({ ...prev, coverImageUrl: url }));
  };

  const handleVideoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024 * 1024) { // 1GB limit
        toast.error('Video file must be smaller than 1GB');
        return;
      }
      setVideoFile(file);
      // Clear URL if file is uploaded
      setFormData(prev => ({ ...prev, videoUrl: '' }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="bg-gradient-to-br from-white to-orange-50/30 border-orange-200/50 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-orange-500/10 to-purple-500/10 border-b border-orange-200/50">
          <CardTitle className="flex items-center gap-2 text-2xl bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
            <Video className="h-6 w-6 text-orange-600" />
            Create Video Podcast
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Upload and publish official video podcasts to the SkillPulse Media Page with structured data for proper display and discovery.
          </p>
        </CardHeader>
        
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Podcast Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-orange-700 font-medium flex items-center gap-2">
                🎧 Podcast Title *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Building Tech Startups in Africa with Sarah Mumba"
                className="border-orange-300 focus:border-orange-500 focus:ring-orange-200"
                required
              />
            </div>

            {/* Guest Name and Episode Number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="guestName" className="text-purple-700 font-medium flex items-center gap-2">
                  🎤 Guest Name(s)
                </Label>
                <Input
                  id="guestName"
                  value={formData.guestName}
                  onChange={(e) => setFormData(prev => ({ ...prev, guestName: e.target.value }))}
                  placeholder="Sarah Mumba – Co-Founder, ZedTechHub"
                  className="border-purple-300 focus:border-purple-500 focus:ring-purple-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="episodeNumber" className="text-orange-700 font-medium flex items-center gap-2">
                  🎚️ Episode Number (Optional)
                </Label>
                <Input
                  id="episodeNumber"
                  value={formData.episodeNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, episodeNumber: e.target.value }))}
                  placeholder="Episode 5"
                  className="border-orange-300 focus:border-orange-500 focus:ring-orange-200"
                />
              </div>
            </div>

            {/* Recording Date */}
            <div className="space-y-2">
              <Label className="text-purple-700 font-medium flex items-center gap-2">
                🗓️ Recording Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-purple-300 focus:border-purple-500",
                      !formData.recordingDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.recordingDate ? format(formData.recordingDate, "PPP") : "Pick recording date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.recordingDate}
                    onSelect={(date) => setFormData(prev => ({ ...prev, recordingDate: date }))}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-orange-700 font-medium flex items-center gap-2">
                📄 Podcast Description *
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="In this episode, we talk to Sarah Mumba about how she launched one of Zambia's fastest-growing tech startups. We discuss funding, team-building, and what it takes to scale in Africa's emerging tech landscape."
                rows={6}
                className="border-orange-300 focus:border-orange-500 focus:ring-orange-200"
                required
              />
            </div>

            {/* Tags and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="tags" className="text-purple-700 font-medium flex items-center gap-2">
                  🏷️ Tags/Topics
                </Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="Tech Startups, AI in Africa, Entrepreneurship"
                  className="border-purple-300 focus:border-purple-500 focus:ring-purple-200"
                />
                <p className="text-sm text-gray-600">
                  Separate tags with commas. Suggested: {tagOptions.slice(0, 3).join(', ')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-orange-700 font-medium flex items-center gap-2">
                  📁 Category/Series
                </Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger className="border-orange-300 focus:border-orange-500 focus:ring-orange-200">
                    <SelectValue placeholder="Choose a series" />
                  </SelectTrigger>
                  <SelectContent>
                    {seriesOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Video Upload Section */}
            <div className="space-y-4">
              <Label className="text-purple-700 font-medium flex items-center gap-2">
                📼 Video Upload or Link *
              </Label>
              
              {/* Video URL Option */}
              <div className="space-y-2">
                <Label htmlFor="videoUrl" className="text-sm text-gray-700">Option A: Video URL (YouTube, Vimeo, etc.)</Label>
                <Input
                  id="videoUrl"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=..."
                  className="border-purple-300 focus:border-purple-500 focus:ring-purple-200"
                  disabled={!!videoFile}
                />
              </div>

              {/* Video File Upload Option */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-700">Option B: Upload Video File (MP4, max 1GB)</Label>
                <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/ogg"
                    onChange={handleVideoFileChange}
                    className="hidden"
                    id="video-upload"
                    disabled={!!formData.videoUrl}
                  />
                  <label
                    htmlFor="video-upload"
                    className={cn(
                      "cursor-pointer flex flex-col items-center gap-2",
                      (formData.videoUrl || loading) && "cursor-not-allowed opacity-50"
                    )}
                  >
                    <Upload className="h-8 w-8 text-purple-500" />
                    <span className="text-sm text-gray-600">
                      {videoFile ? videoFile.name : "Click to upload video file"}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Cover Image Upload */}
            <div className="space-y-2">
              <Label className="text-orange-700 font-medium flex items-center gap-2">
                🖼️ Podcast Cover Image
              </Label>
              <FileUpload
                bucket="course-thumbnails"
                path="podcast-covers"
                accept="image/*"
                maxSize={10}
                onUploadComplete={handleCoverImageUpload}
                existingUrl={formData.coverImageUrl}
                label="Upload Cover Image (1280x720px recommended)"
              />
            </div>

            {/* Publish Status and Schedule */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-purple-700 font-medium flex items-center gap-2">
                  ✅ Publish Status
                </Label>
                <Select value={formData.publishStatus} onValueChange={(value: any) => setFormData(prev => ({ ...prev, publishStatus: value }))}>
                  <SelectTrigger className="border-purple-300 focus:border-purple-500 focus:ring-purple-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.publishStatus === 'scheduled' && (
                <div className="space-y-2">
                  <Label className="text-orange-700 font-medium flex items-center gap-2">
                    ⏰ Schedule Publish Date/Time
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal border-orange-300",
                          !formData.scheduleDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.scheduleDate ? format(formData.scheduleDate, "PPP") : "Pick schedule date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.scheduleDate}
                        onSelect={(date) => setFormData(prev => ({ ...prev, scheduleDate: date }))}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white h-12 font-semibold"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {formData.publishStatus === 'published' ? 'Create & Publish' : 'Save Podcast'}
                  </>
                )}
              </Button>
              
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1 sm:flex-none sm:w-32 border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoPodcastForm;
