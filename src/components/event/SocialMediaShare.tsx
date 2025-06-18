
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';

interface SocialMediaShareProps {
  eventTitle: string;
  eventUrl: string;
  eventDescription?: string;
}

const SocialMediaShare: React.FC<SocialMediaShareProps> = ({ 
  eventTitle, 
  eventUrl, 
  eventDescription 
}) => {
  const shareText = `Check out this amazing event: ${eventTitle}`;
  const fullUrl = `${window.location.origin}${eventUrl}`;

  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: '📱',
      url: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${fullUrl}`)}`,
      color: 'hover:bg-green-50 hover:text-green-600'
    },
    {
      name: 'Facebook',
      icon: '👤',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
      color: 'hover:bg-blue-50 hover:text-blue-600'
    },
    {
      name: 'TikTok',
      icon: '🎵',
      url: `https://www.tiktok.com/share?url=${encodeURIComponent(fullUrl)}`,
      color: 'hover:bg-black hover:text-white'
    },
    {
      name: 'Instagram',
      icon: '📷',
      url: `https://www.instagram.com/`,
      color: 'hover:bg-pink-50 hover:text-pink-600'
    },
    {
      name: 'LinkedIn',
      icon: '💼',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`,
      color: 'hover:bg-blue-50 hover:text-blue-800'
    }
  ];

  const handleShare = (url: string, name: string) => {
    if (name === 'Instagram') {
      // Instagram doesn't support direct URL sharing, so copy to clipboard
      navigator.clipboard.writeText(`${shareText} ${fullUrl}`);
      alert('Link copied to clipboard! You can now paste it in your Instagram story or post.');
      return;
    }
    window.open(url, '_blank', 'width=600,height=400');
  };

  return (
    <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Share2 className="h-5 w-5" />
          Share This Event
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-3">
          {shareLinks.map((platform) => (
            <Button
              key={platform.name}
              variant="outline"
              size="sm"
              onClick={() => handleShare(platform.url, platform.name)}
              className={`flex flex-col items-center gap-1 h-auto py-3 ${platform.color} transition-colors`}
            >
              <span className="text-xl">{platform.icon}</span>
              <span className="text-xs font-medium">{platform.name}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SocialMediaShare;
