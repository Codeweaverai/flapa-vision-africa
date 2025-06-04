
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { Download, FileText, Link as LinkIcon, Video, Image as ImageIcon, File } from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  file_url: string;
  file_type: string;
  file_size?: number;
}

interface LessonResourcesProps {
  lessonId: string;
}

const LessonResources = ({ lessonId }: LessonResourcesProps) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (lessonId) {
      loadResources();
    }
  }, [lessonId]);

  const loadResources = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('lesson_resources')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setResources(data);
    }
    setLoading(false);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (fileType.includes('video')) return <Video className="h-5 w-5 text-blue-500" />;
    if (fileType.includes('image')) return <ImageIcon className="h-5 w-5 text-green-500" />;
    if (fileType.includes('link')) return <LinkIcon className="h-5 w-5 text-purple-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Lesson Resources</CardTitle>
      </CardHeader>
      <CardContent>
        {resources.length > 0 ? (
          <div className="space-y-3">
            {resources.map((resource) => (
              <div key={resource.id} className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                <div className="flex items-center gap-3">
                  {getFileIcon(resource.file_type)}
                  <div>
                    <h4 className="font-medium">{resource.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {resource.file_type}
                      {resource.file_size && ` • ${formatFileSize(resource.file_size)}`}
                    </p>
                  </div>
                </div>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(resource.file_url, resource.title)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <File className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">No resources available</h3>
            <p className="text-gray-600">No downloadable resources have been provided for this lesson.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LessonResources;
