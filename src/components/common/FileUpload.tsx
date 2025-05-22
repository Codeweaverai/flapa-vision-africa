
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabaseClient';
import { Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface FileUploadProps {
  bucket: string;
  path?: string;
  accept?: string;
  maxSize?: number; // in MB
  onUploadComplete: (url: string, path: string) => void;
  existingUrl?: string;
  label?: string;
  className?: string;
}

const FileUpload = ({
  bucket,
  path = '',
  accept = 'image/*',
  maxSize = 5, // Default to 5MB
  onUploadComplete,
  existingUrl,
  label = 'Upload File',
  className = '',
}: FileUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(existingUrl || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Clear any previous errors
    setError(null);
    setIsUploading(true);

    try {
      // Create a preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }

      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = path ? `${path}/${fileName}` : fileName;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      // Call the onUploadComplete callback with the URL
      onUploadComplete(publicUrl, filePath);
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Error uploading file. Please try again.');
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const clearFile = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onUploadComplete('', '');
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label>{label}</Label>
      
      {preview ? (
        <div className="relative rounded-md overflow-hidden border">
          {preview.startsWith('data:image') || preview.includes('storage.googleapis.com') ? (
            <img 
              src={preview} 
              alt="Preview" 
              className="h-40 w-full object-cover" 
            />
          ) : (
            <div className="h-40 w-full flex items-center justify-center bg-muted">
              <span className="text-muted-foreground">File uploaded</span>
            </div>
          )}
          
          <Button 
            variant="destructive" 
            size="icon" 
            className="absolute top-2 right-2 h-8 w-8"
            onClick={clearFile}
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md border-muted-foreground/25 hover:border-primary/50 transition-colors">
          {isUploading ? (
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                {accept === 'image/*' 
                  ? 'SVG, PNG, JPG or GIF' 
                  : accept.replace(/\./g, '').toUpperCase()}
                {` (Max ${maxSize}MB)`}
              </p>
            </>
          )}
          <Input 
            ref={fileInputRef}
            type="file" 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileChange}
            accept={accept}
            disabled={isUploading}
          />
        </div>
      )}
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};

export default FileUpload;
