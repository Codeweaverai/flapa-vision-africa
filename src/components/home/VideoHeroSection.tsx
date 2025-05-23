
import React, { useRef, useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
import { cn } from '@/lib/utils';

const VideoHeroSection: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isReady, setIsReady] = useState(false);
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

  const handleReady = () => {
    setIsReady(true);
  };

  return (
    <section ref={sectionRef} className="relative h-[90vh] w-full overflow-hidden bg-black">
      {/* Background Video */}
      <div className="absolute inset-0 w-full h-full">
        <ReactPlayer
          url="https://youtu.be/IJh6KbJznx8"
          playing={true}
          loop={true}
          muted={true}
          width="100%"
          height="100%"
          config={{
            youtube: {
              playerVars: {
                autoplay: 1,
                controls: 0,
                disablekb: 1,
                fs: 0,
                iv_load_policy: 3,
                modestbranding: 1,
                playsinline: 1,
                rel: 0,
                showinfo: 0,
              },
            },
          }}
          style={{ position: 'absolute', top: 0, left: 0 }}
          className="object-cover"
          onReady={handleReady}
        />
        {/* Dark overlay for better text visibility */}
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
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
