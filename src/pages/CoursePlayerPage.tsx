
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { 
  fetchCourseWithModulesAndLessons,
  checkEnrollmentStatus,
  saveLessonProgress,
  LessonProgress,
  CourseWithModules,
  Lesson
} from '@/services/courseService';

const CoursePlayerPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<CourseWithModules | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentModule, setCurrentModule] = useState<number>(0);
  const [currentLesson, setCurrentLesson] = useState<number>(0);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [videoLoaded, setVideoLoaded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('content');

  // YouTube Player reference
  const playerRef = useRef<YT.Player | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const youtubeScriptLoaded = useRef<boolean>(false);

  // Function to load YouTube API
  const loadYouTubeAPI = () => {
    // If YouTube API is already loaded, initialize the player
    if (window.YT && window.YT.Player) {
      youtubeScriptLoaded.current = true;
      initializeYouTubePlayer();
      return;
    }

    // If YouTube API is not loaded yet and we haven't set the callback
    if (!window.onYouTubeIframeAPIReady) {
      window.onYouTubeIframeAPIReady = () => {
        youtubeScriptLoaded.current = true;
        initializeYouTubePlayer();
      };
    }
  };

  // Initialize course data
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        if (!courseId) return;
        
        setLoading(true);
        const courseData = await fetchCourseWithModulesAndLessons(courseId);
        
        if (courseData) {
          setCourse(courseData);
          
          // Check if user is enrolled
          if (user) {
            const enrolled = await checkEnrollmentStatus(courseId);
            setIsEnrolled(enrolled);

            if (!enrolled && !courseData.is_free) {
              navigate(`/learning/course/${courseId}`);
            }
          } else {
            navigate('/login', { state: { from: `/learning/player/${courseId}` } });
          }
        } else {
          toast.error("Course not found");
          navigate('/learning');
        }
      } catch (error) {
        console.error("Error loading course:", error);
        toast.error("Failed to load course");
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId, user, navigate]);

  // Initialize YouTube player when course data is loaded
  useEffect(() => {
    if (course && !loading) {
      loadYouTubeAPI();
    }
  }, [course, loading, currentLesson, currentModule]);

  // Initialize YouTube player
  const initializeYouTubePlayer = () => {
    if (!course || 
        !course.modules || 
        course.modules.length === 0 || 
        !course.modules[currentModule] || 
        !course.modules[currentModule].lessons ||
        course.modules[currentModule].lessons.length === 0 ||
        !course.modules[currentModule].lessons[currentLesson] ||
        !course.modules[currentModule].lessons[currentLesson].video_url) {
      return;
    }

    const currentLessonData = course.modules[currentModule].lessons[currentLesson];
    const videoUrl = currentLessonData.video_url;

    // Extract YouTube video ID from URL
    const extractVideoId = (url: string) => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    };

    const videoId = extractVideoId(videoUrl || '');

    if (!videoId || !playerContainerRef.current) {
      return;
    }

    // Destroy existing player if it exists
    if (playerRef.current) {
      playerRef.current.destroy();
    }

    // Create new player
    if (window.YT && window.YT.Player && playerContainerRef.current) {
      try {
        playerRef.current = new window.YT.Player(playerContainerRef.current, {
          videoId: videoId,
          height: '100%',
          width: '100%',
          playerVars: {
            autoplay: 0,
            controls: 0,  // Hide YouTube controls
            modestbranding: 1,
            rel: 0,  // Don't show related videos
            showinfo: 0,  // Hide video title
            fs: 0  // Disable fullscreen button
          },
          events: {
            onReady: (event) => {
              setVideoLoaded(true);
            },
            onStateChange: (event) => {
              handlePlayerStateChange(event);
            }
          }
        });
      } catch (error) {
        console.error("Error initializing YouTube player:", error);
      }
    }
  };

  // Handle YouTube player state changes
  const handlePlayerStateChange = (event: YT.PlayerEvent) => {
    switch (event.data) {
      case window.YT.PlayerState.PLAYING:
        setIsPlaying(true);
        break;
      case window.YT.PlayerState.PAUSED:
      case window.YT.PlayerState.ENDED:
      case window.YT.PlayerState.UNSTARTED:
        setIsPlaying(false);
        break;
      default:
        break;
    }

    // Update progress
    if (playerRef.current) {
      const duration = playerRef.current.getDuration();
      const currentTime = playerRef.current.getCurrentTime();
      const progress = (currentTime / duration) * 100;
      setVideoProgress(progress);
      
      // Save progress periodically
      saveProgress(currentTime, progress >= 95);
    }
  };

  // Save lesson progress
  const saveProgress = async (position: number, isCompleted: boolean = false) => {
    if (!user || !course || !course.modules) return;

    try {
      // Here you would typically save progress to the backend
      // This is a placeholder for the actual implementation
      console.log("Saving progress:", {
        position,
        isCompleted,
        lessonId: course.modules[currentModule].lessons[currentLesson].id
      });

      // You would use a function like the one below:
      /*
      await saveLessonProgress(
        enrollmentId,
        course.modules[currentModule].lessons[currentLesson].id,
        position,
        isCompleted
      );
      */
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    if (!playerRef.current) return;
    
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  // Change lesson
  const changeLesson = (moduleIndex: number, lessonIndex: number) => {
    setCurrentModule(moduleIndex);
    setCurrentLesson(lessonIndex);
    setVideoLoaded(false);
    setVideoProgress(0);
  };

  // Handle lesson completion
  const markLessonCompleted = async () => {
    if (!playerRef.current) return;
    
    const currentTime = playerRef.current.getCurrentTime();
    const duration = playerRef.current.getDuration();
    
    // Mark lesson as completed if watched more than 95%
    if ((currentTime / duration) >= 0.95) {
      await saveProgress(currentTime, true);
      toast.success("Lesson marked as completed!");
    } else {
      toast.error("Please watch at least 95% of the video to mark it as complete");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <p className="text-lg">Loading course...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <p className="text-lg text-red-600">Course not found</p>
              <Button 
                className="mt-4" 
                onClick={() => navigate('/learning')}
              >
                Back to Courses
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const currentLessonData = course.modules[currentModule]?.lessons[currentLesson];

  return (
    <Layout>
      <div className="container py-4 md:py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-4">{course.title}</h1>
        
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Video Player Column */}
          <div className="w-full lg:w-2/3">
            <Card>
              <CardContent className="p-0">
                {/* Custom Video Player */}
                <div className="bg-black relative aspect-video">
                  {/* YouTube Player Container */}
                  <div ref={playerContainerRef} className="w-full h-full"></div>
                  
                  {/* Loading Overlay */}
                  {!videoLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
                      Loading video...
                    </div>
                  )}
                  
                  {/* Video Controls */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                    <div className="flex flex-col space-y-2">
                      <Progress value={videoProgress} className="h-1 bg-gray-600" />
                      
                      <div className="flex justify-between items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white"
                          onClick={togglePlayPause}
                        >
                          {isPlaying ? (
                            <Pause className="h-4 w-4 mr-2" />
                          ) : (
                            <Play className="h-4 w-4 mr-2" />
                          )}
                          {isPlaying ? 'Pause' : 'Play'}
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white"
                          onClick={markLessonCompleted}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark Complete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Lesson Info */}
            <div className="mt-4">
              <Tabs defaultValue="content" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="materials">Materials</TabsTrigger>
                  <TabsTrigger value="discussion">Discussion</TabsTrigger>
                </TabsList>
                
                <TabsContent value="content" className="p-4 border rounded-md">
                  <h3 className="text-xl font-semibold mb-2">{currentLessonData?.title}</h3>
                  <p className="text-gray-600">
                    {currentLessonData?.description || 'No description available.'}
                  </p>
                </TabsContent>
                
                <TabsContent value="materials" className="p-4 border rounded-md">
                  <h3 className="text-xl font-semibold mb-2">Lesson Materials</h3>
                  {currentLessonData?.materials_urls && currentLessonData.materials_urls.length > 0 ? (
                    <ul className="list-disc pl-6">
                      {currentLessonData.materials_urls.map((url, index) => (
                        <li key={index}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Material {index + 1}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600">No materials available for this lesson.</p>
                  )}
                </TabsContent>
                
                <TabsContent value="discussion" className="p-4 border rounded-md">
                  <h3 className="text-xl font-semibold mb-2">Discussion</h3>
                  <p className="text-gray-600">Discussion feature coming soon!</p>
                </TabsContent>
              </Tabs>
            </div>
          </div>
          
          {/* Course Outline Column */}
          <div className="w-full lg:w-1/3">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-xl font-semibold mb-4">Course Outline</h3>
                
                <div className="space-y-4">
                  {course.modules.map((module, moduleIndex) => (
                    <div key={module.id} className="border rounded-md overflow-hidden">
                      <div className="bg-gray-100 p-3 font-medium">
                        {module.title}
                      </div>
                      
                      <div className="p-2">
                        {module.lessons && module.lessons.map((lesson, lessonIndex) => (
                          <div key={lesson.id}>
                            <Button
                              variant="ghost"
                              className={`w-full justify-start py-2 px-3 rounded-none ${
                                moduleIndex === currentModule && lessonIndex === currentLesson
                                  ? 'bg-primary/10 text-primary'
                                  : ''
                              }`}
                              onClick={() => changeLesson(moduleIndex, lessonIndex)}
                            >
                              <div className="flex items-center">
                                <div className="mr-2 w-5 h-5 flex items-center justify-center">
                                  {moduleIndex === currentModule && lessonIndex === currentLesson ? (
                                    <CheckCircle className="h-4 w-4" />
                                  ) : (
                                    <span className="text-sm">{lessonIndex + 1}</span>
                                  )}
                                </div>
                                <span className="truncate">{lesson.title}</span>
                              </div>
                            </Button>
                            {lessonIndex < module.lessons.length - 1 && <Separator />}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CoursePlayerPage;
