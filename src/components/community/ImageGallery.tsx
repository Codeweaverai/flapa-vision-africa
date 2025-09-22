import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CommunityPostImage } from '@/services/communityImageService';

interface ImageGalleryProps {
  images: CommunityPostImage[];
  className?: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  className = ''
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => 
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  const renderImageGrid = () => {
    if (images.length === 1) {
      return (
        <div className="w-full">
          <img
            src={images[0].image_url}
            alt={images[0].alt_text || 'Post image'}
            className="w-full h-64 sm:h-80 object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
            onClick={() => openLightbox(0)}
          />
        </div>
      );
    }

    if (images.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-2">
          {images.map((image, index) => (
            <img
              key={image.id}
              src={image.image_url}
              alt={image.alt_text || `Post image ${index + 1}`}
              className="w-full h-32 sm:h-40 object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
              onClick={() => openLightbox(index)}
            />
          ))}
        </div>
      );
    }

    if (images.length === 3) {
      return (
        <div className="grid grid-cols-2 gap-2">
          <img
            src={images[0].image_url}
            alt={images[0].alt_text || 'Post image 1'}
            className="w-full h-40 sm:h-48 object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
            onClick={() => openLightbox(0)}
          />
          <div className="grid grid-rows-2 gap-2">
            {images.slice(1, 3).map((image, index) => (
              <img
                key={image.id}
                src={image.image_url}
                alt={image.alt_text || `Post image ${index + 2}`}
                className="w-full h-19 sm:h-23 object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                onClick={() => openLightbox(index + 1)}
              />
            ))}
          </div>
        </div>
      );
    }

    // 4+ images
    return (
      <div className="grid grid-cols-2 gap-2">
        {images.slice(0, 3).map((image, index) => (
          <img
            key={image.id}
            src={image.image_url}
            alt={image.alt_text || `Post image ${index + 1}`}
            className={`object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity ${
              index === 0 ? 'col-span-2 h-40 sm:h-48' : 'h-19 sm:h-23'
            }`}
            onClick={() => openLightbox(index)}
          />
        ))}
        
        {images.length > 3 && (
          <div 
            className="relative h-19 sm:h-23 rounded-lg cursor-pointer overflow-hidden"
            onClick={() => openLightbox(3)}
          >
            <img
              src={images[3].image_url}
              alt={images[3].alt_text || 'Post image 4'}
              className="w-full h-full object-cover"
            />
            {images.length > 4 && (
              <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                <span className="text-white text-lg font-semibold">
                  +{images.length - 3}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className={`mt-4 ${className}`}>
        {renderImageGrid()}
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl w-full h-[90vh] p-0 bg-black">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
              onClick={closeLightbox}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Navigation buttons */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 z-10 text-white hover:bg-white/20"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 z-10 text-white hover:bg-white/20"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}

            {/* Current image */}
            <img
              src={images[currentImageIndex]?.image_url}
              alt={images[currentImageIndex]?.alt_text || 'Post image'}
              className="max-w-full max-h-full object-contain"
            />

            {/* Image counter */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1} / {images.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};