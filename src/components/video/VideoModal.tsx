
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import VideoPlayer from '@/components/video/VideoPlayer';
import { X } from 'lucide-react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
  thumbnail?: string;
}

const VideoModal: React.FC<VideoModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  title,
  thumbnail
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0 bg-black border-none">
        <DialogHeader className="absolute top-2 right-2 z-10">
          <button 
            onClick={onClose}
            className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </DialogHeader>
        <div className="aspect-video w-full">
          <VideoPlayer
            src={videoUrl}
            poster={thumbnail}
            controls={true}
            autoplay={true}
            className="w-full h-full rounded-lg"
          />
        </div>
        <div className="p-4 bg-white">
          <DialogTitle className="text-lg font-semibold text-gray-800">
            {title} - Course Preview
          </DialogTitle>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoModal;
