
import React, { useRef, useEffect, useState } from 'react';
import VideoPlayer from '@/components/video/VideoPlayer';
import { cn } from '@/lib/utils';

const VideoHeroSection: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // When the section becomes visible in the viewport
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 } // Trigger when 20% of the element is visible
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative h-[90vh] w-full overflow-hidden bg-black">
      {/* Background Video */}
      <div className="absolute inset-0 w-full h-full">
        <VideoPlayer
          src="https://s3.eu-west-1.wasabisys.com/skillpulse/1115056_Broadcast_Man_3840x2160.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=HDSCC6MSIYKGL4EUVTAN%2F20250523%2Feu-west-1%2Fs3%2Faws4_request&X-Amz-Date=20250523T113031Z&X-Amz-Expires=7200&X-Amz-Signature=71cb4b8770b58881eeb2e5f5b8218f657b6586ca02b94319c5484e108697d385&X-Amz-SignedHeaders=host&x-id=GetObject"
          autoplay={true}
          controls={false}
          className="object-cover w-full h-full"
        />
        {/* Dark overlay for better text visibility */}
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      </div>

      {/* Text Animation Container */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
        <div className="space-y-6">
          {/* Main heading with animation */}
          <h2 
            className={cn(
              "text-3xl md:text-5xl lg:text-6xl font-bold text-white opacity-0 transition-all duration-1000",
              isVisible && "opacity-100 translate-y-0"
            )}
            style={{ 
              transitionDelay: "300ms",
              transform: isVisible ? "translateY(0)" : "translateY(40px)"
            }}
          >
            Redefining Professional
          </h2>
          
          <div 
            className={cn(
              "text-4xl md:text-6xl lg:text-7xl text-gradient bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-orange-500 font-extrabold opacity-0 transition-all duration-1000",
              isVisible && "opacity-100 translate-y-0"
            )}
            style={{ 
              transitionDelay: "600ms",
              transform: isVisible ? "translateY(0)" : "translateY(40px)"
            }}
          >
            Skill Development
          </div>
          
          <p 
            className={cn(
              "text-2xl md:text-3xl lg:text-4xl text-white opacity-0 transition-all duration-1000",
              isVisible && "opacity-100 translate-y-0"
            )}
            style={{ 
              transitionDelay: "900ms",
              transform: isVisible ? "translateY(0)" : "translateY(40px)"
            }}
          >
            with <span className="font-bold text-primary">SkillPulse</span>
          </p>
          
          {/* Animated underline */}
          <div 
            className={cn(
              "h-1 bg-gradient-to-r from-purple-400 via-pink-500 to-orange-500 mx-auto opacity-0 transition-all duration-1000",
              isVisible && "opacity-100 w-48 md:w-80"
            )}
            style={{ 
              transitionDelay: "1200ms",
              width: isVisible ? "20rem" : "0"
            }}
          ></div>
        </div>
      </div>
    </section>
  );
};

export default VideoHeroSection;
