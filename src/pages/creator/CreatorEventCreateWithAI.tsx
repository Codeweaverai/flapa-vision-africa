import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bot, Sparkles, Calendar, Clock, Users, Zap, CheckCircle, ArrowRight, Play, Star, MapPin, Ticket, Mic, Plus, X, User, Music, Camera, Image, Shield, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

// Custom hook for real-time progress tracking
const useAIProgress = (progressId: string | null) => {
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!progressId) {
      setLoading(false);
      return;
    }

    let subscription: any;

    const setupRealtime = async () => {
      // First, fetch the current progress
      const { data: initialProgress, error } = await supabase
        .from('ai_generation_progress')
        .select('*')
        .eq('id', progressId)
        .single();

      if (error) {
        console.error('Error fetching initial progress:', error);
        setLoading(false);
        return;
      }

      if (initialProgress) {
        setProgress(initialProgress);
      }
      setLoading(false);

      // Then set up real-time subscription
      subscription = supabase
        .channel(`ai-progress-${progressId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ai_generation_progress',
            filter: `id=eq.${progressId}`
          },
          (payload) => {
            console.log('Real-time progress update:', payload);
            setProgress(payload.new);
          }
        )
        .subscribe((status) => {
          console.log('Subscription status:', status);
        });
    };

    setupRealtime();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [progressId]);

  return { progress, loading };
};

interface SpeakerInput {
  id: string;
  name: string;
  role: 'keynote' | 'performer' | 'artist' | 'panelist';
  linkedinUrl: string;
  twitterUrl: string;
  websiteUrl: string;
  expertise: string;
}

const CreatorEventCreateWithAI = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'generating' | 'proposal' | 'creating'>('input');
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    eventType: 'webinar',
    targetAudience: '',
    duration: '',
    location: '',
    keyTopics: '',
    maxPrice: '25'
  });
  
  const [speakers, setSpeakers] = useState<SpeakerInput[]>([
    {
      id: '1',
      name: '',
      role: 'keynote',
      linkedinUrl: '',
      twitterUrl: '',
      websiteUrl: '',
      expertise: ''
    }
  ]);
  
  const [proposal, setProposal] = useState<any>(null);
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [progressId, setProgressId] = useState<string | null>(null);
  
  // Use the progress tracking hook
  const { progress: realTimeProgress, loading: progressLoading } = useAIProgress(progressId);

  const handleInputChange = (field: string, value: string) => {
    setEventData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addSpeaker = () => {
    setSpeakers(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        name: '',
        role: 'keynote',
        linkedinUrl: '',
        twitterUrl: '',
        websiteUrl: '',
        expertise: ''
      }
    ]);
  };

  const removeSpeaker = (id: string) => {
    if (speakers.length > 1) {
      setSpeakers(prev => prev.filter(speaker => speaker.id !== id));
    }
  };

  const updateSpeaker = (id: string, field: string, value: string) => {
    setSpeakers(prev => prev.map(speaker => 
      speaker.id === id ? { ...speaker, [field]: value } : speaker
    ));
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'keynote': return <Mic className="h-4 w-4" />;
      case 'performer': return <Music className="h-4 w-4" />;
      case 'artist': return <Camera className="h-4 w-4" />;
      case 'panelist': return <Users className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const generateProposal = async () => {
    if (!eventData.title.trim() || !eventData.description.trim()) {
      toast.error('Please provide at least an event title and description');
      return;
    }

    const validSpeakers = speakers.filter(s => s.name.trim() !== '');
    if (validSpeakers.length === 0) {
      toast.error('Please add at least one speaker or performer');
      return;
    }

    setLoading(true);
    setStep('generating');

    try {
      const speakerDetails = validSpeakers.map(speaker => 
        `Name: ${speaker.name}, Role: ${speaker.role}, Expertise: ${speaker.expertise}, LinkedIn: ${speaker.linkedinUrl || 'Not provided'}, Twitter: ${speaker.twitterUrl || 'Not provided'}, Website: ${speaker.websiteUrl || 'Not provided'}`
      ).join('\n');

      const prompt = `Create a comprehensive event about: ${eventData.title}
      
Description: ${eventData.description}
Event Type: ${eventData.eventType}
Target Audience: ${eventData.targetAudience}
Duration: ${eventData.duration}
Location: ${eventData.location}
Key Topics: ${eventData.keyTopics}
Maximum Ticket Price: $${eventData.maxPrice}

SPECIFIC SPEAKERS/PERFORMERS TO RESEARCH AND INCLUDE:
${speakerDetails}

Please generate a detailed event proposal with agenda, speaker profiles based on the provided names and links, and tickets. Ensure ticket prices are between $3 and $${eventData.maxPrice}.`;

      const { data, error } = await supabase.functions.invoke('generate-event', {
        body: {
          user_prompt: prompt,
          creator_id: user?.id,
          action: 'generate_proposal'
        }
      });

      if (error) throw error;

      if (data.success) {
        setProposal(data.proposal);
        setProposalId(data.proposal_id);
        setStep('proposal');
        toast.success('Event proposal generated successfully!');
      } else {
        throw new Error(data.error || 'Failed to generate proposal');
      }
    } catch (error: any) {
      console.error('Error generating proposal:', error);
      toast.error(error.message || 'Failed to generate event proposal');
      setStep('input');
    } finally {
      setLoading(false);
    }
  };

  const createFullEvent = async () => {
    if (!proposal) return;

    setLoading(true);
    setStep('creating');

    try {
      const { data, error } = await supabase.functions.invoke('generate-event', {
        body: {
          creator_id: user?.id,
          action: 'generate_full_event',
          proposal_id: proposalId
        }
      });

      if (error) throw error;

      if (data.success) {
        // Wait a moment for the final progress update to come through
        setTimeout(() => {
          toast.success('Event created successfully with AI Agents!');
          navigate(`/creator/events/${data.event_id}/edit`);
        }, 1000);
      } else {
        throw new Error(data.error || 'Failed to create event');
      }
    } catch (error: any) {
      console.error('Error creating event:', error);
      
      if (error.message?.includes('Stored proposal not found')) {
        toast.error('The event proposal expired. Please generate a new proposal.');
        setStep('input');
      } else if (error.message?.includes('timeout')) {
        toast.error('Event generation is taking longer than expected. Please try again.');
        setStep('proposal');
      } else {
        toast.error(error.message || 'Failed to create event. Please try again.');
        setStep('proposal');
      }
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <Zap className="h-5 w-5" />,
      title: "AI Manager Agent",
      description: "Intelligent coordination of specialized AI agents"
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      title: "Complete Agenda",
      description: "Includes detailed event schedule and timing"
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Real Speaker Verification",
      description: "Authentic speaker profiles with verification"
    },
    {
      icon: <Image className="h-5 w-5" />,
      title: "AI Image Generation",
      description: "Automated event banners & speaker portraits"
    },
    {
      icon: <Mic className="h-5 w-5" />,
      title: "Specific Speaker Research",
      description: "Research real speakers based on your inputs"
    },
    {
      icon: <Ticket className="h-5 w-5" />,
      title: "Affordable Pricing",
      description: "Ticket prices optimized between $3-$40"
    }
  ];

  const eventTypes = [
    'webinar', 'conferences', 'live-music', 'sports-events', 'night-life',
    'concerts', 'comedy-shows', 'business-events', 'wellness-events', 'summit',
    'workshops', 'festivals', 'tech-meetups', 'cultural-events'
  ];

  const speakerRoles = [
    { value: 'keynote', label: 'Keynote Speaker', icon: <Mic className="h-4 w-4" /> },
    { value: 'performer', label: 'Music Performer', icon: <Music className="h-4 w-4" /> },
    { value: 'artist', label: 'Visual Artist', icon: <Camera className="h-4 w-4" /> },
    { value: 'panelist', label: 'Panelist', icon: <Users className="h-4 w-4" /> }
  ];

  const gradientClass = "bg-gradient-to-r from-orange-500 to-purple-600";
  const gradientTextClass = "bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent";
  const gradientHoverClass = "hover:from-orange-600 hover:to-purple-700";

  // Enhanced progress tracking with real-time data
  const currentProgress = realTimeProgress ? {
    percentage: realTimeProgress.progress_percentage || 0,
    step: realTimeProgress.current_step || 'Initializing...',
    agentActivity: realTimeProgress.agent_activity || {}
  } : {
    percentage: 0,
    step: 'Initializing...',
    agentActivity: {}
  };

  const getAgentStatus = (agent: string) => {
    if (!currentProgress.agentActivity) return 'pending';
    return currentProgress.agentActivity[agent] || 'pending';
  };

  const getAgentStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'active': return 'bg-orange-500 animate-pulse';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  const getAgentDisplayName = (agent: string) => {
    const agentNames: { [key: string]: string } = {
      manager: 'Manager Agent',
      structure: 'Structure Agent',
      agenda: 'Agenda Agent',
      speaker: 'Speaker Agent',
      ticket: 'Ticket Agent',
      image: 'Image Agent'
    };
    return agentNames[agent] || agent;
  };

  const getAgentIcon = (agent: string) => {
    switch (agent) {
      case 'manager': return <Bot className="h-4 w-4" />;
      case 'structure': return <Calendar className="h-4 w-4" />;
      case 'agenda': return <Clock className="h-4 w-4" />;
      case 'speaker': return <Mic className="h-4 w-4" />;
      case 'ticket': return <Ticket className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  // Effect to handle progress ID from the create event response
  useEffect(() => {
    if (step === 'creating' && !progressId) {
      // In a real implementation, you might get the progress ID from the create event response
      // For now, we'll simulate it by setting a timeout to show progress
      const timer = setTimeout(() => {
        // This would typically come from the createFullEvent response
        // setProgressId(data.progress_id);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [step, progressId]);

  return (
    <CreatorLayout title="Create Event with AI">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center items-center space-x-3">
            <div className={`rounded-full ${gradientClass} p-3 shadow-lg`}>
              <Bot className="h-8 w-8 text-white" />
            </div>
            <Sparkles className="h-8 w-8 text-orange-500" />
            <Image className="h-8 w-8 text-purple-500" />
          </div>
          <h1 className={`text-4xl font-bold ${gradientTextClass}`}>
            AI Event Creator
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create complete, production-ready events with real speaker verification and AI-generated visuals
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="text-center border-0 shadow-lg bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardContent className="pt-6">
                <div className={`mx-auto w-12 h-12 rounded-full ${gradientClass} flex items-center justify-center text-white mb-4 shadow-md`}>
                  {feature.icon}
                </div>
                <h3 className="font-semibold mb-2 text-gray-800">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Step 1: Event Input */}
        {step === 'input' && (
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className={`text-2xl font-bold ${gradientTextClass}`}>
                Describe Your Event
              </CardTitle>
              <CardDescription className="text-lg">
                Provide details about your event and specific speakers/performers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* ... (existing input fields remain the same) ... */}
              
              <Button
                onClick={generateProposal}
                disabled={loading || !eventData.title.trim() || !eventData.description.trim() || speakers.every(s => !s.name.trim())}
                className={`w-full ${gradientClass} text-white font-semibold py-3 rounded-lg ${gradientHoverClass} transition-all duration-200 shadow-lg hover:shadow-xl`}
              >
                <Bot className="h-5 w-5 mr-2" />
                {loading ? 'Generating Proposal...' : 'Generate Event Proposal'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Generating */}
        {step === 'generating' && (
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm text-center">
            <CardContent className="pt-12 pb-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-6"></div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Generating Your Event Proposal</h3>
              <p className="text-gray-600 mb-4">Our AI is crafting a comprehensive event structure with real speaker verification...</p>
              <div className="flex justify-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Proposal Review */}
        {step === 'proposal' && proposal && (
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className={`text-2xl font-bold ${gradientTextClass}`}>
                Event Proposal Generated!
              </CardTitle>
              <CardDescription className="text-lg">
                Review the event structure and create your event
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* ... (existing proposal review content remains the same) ... */}
              
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                <Button
                  onClick={() => {
                    setStep('input');
                    setProposal(null);
                    setProposalId(null);
                  }}
                  variant="outline"
                  className="flex-1 border-2 border-gray-300 hover:border-orange-300 transition-colors"
                >
                  Start Over
                </Button>
                <Button
                  onClick={createFullEvent}
                  disabled={loading}
                  className={`flex-1 ${gradientClass} text-white font-semibold py-3 rounded-lg ${gradientHoverClass} transition-all duration-200 shadow-lg hover:shadow-xl`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Event...
                    </>
                  ) : (
                    <>
                      <Bot className="h-4 w-4 mr-2" />
                      Create with AI Agents
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Creating Event with Enhanced Real-time Progress */}
        {step === 'creating' && (
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className={`text-2xl font-bold ${gradientTextClass}`}>
                Creating Your Event with AI Agents
              </CardTitle>
              <CardDescription className="text-lg">
                Our Manager Agent is coordinating specialized AI agents to build your event
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enhanced Progress Bar */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                  <span className="text-lg font-bold text-orange-600">{currentProgress.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-purple-600 h-4 rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2"
                    style={{ width: `${currentProgress.percentage}%`, minWidth: '40px' }}
                  >
                    {currentProgress.percentage > 10 && (
                      <span className="text-xs font-bold text-white">
                        {currentProgress.percentage}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Current Step with Enhanced Display */}
              <div className="bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-5 w-5 text-orange-500" />
                    <h4 className="font-semibold text-gray-800">Current Activity</h4>
                  </div>
                  <Badge variant="outline" className="bg-white text-orange-600 border-orange-300">
                    {currentProgress.percentage}% Complete
                  </Badge>
                </div>
                <p className="text-lg font-medium text-gray-900 text-center py-2">
                  {currentProgress.step}
                </p>
                {currentProgress.percentage >= 50 && currentProgress.percentage < 100 && (
                  <p className="text-sm text-gray-600 text-center mt-2">
                    This may take a few moments as we research real speaker data and generate visuals...
                  </p>
                )}
              </div>

              {/* Enhanced Agent Activity Grid */}
              <div className="space-y-4">
                <h5 className="font-semibold text-gray-800 flex items-center">
                  <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
                  AI Agent Activity
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {['manager', 'structure', 'agenda', 'speaker', 'ticket', 'image'].map((agent) => {
                    const status = getAgentStatus(agent);
                    const isCompleted = status === 'completed';
                    const isActive = status === 'active';
                    const isError = status === 'error';
                    
                    return (
                      <div 
                        key={agent} 
                        className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                          isCompleted 
                            ? 'bg-green-50 border-green-200 shadow-sm' 
                            : isActive
                            ? 'bg-orange-50 border-orange-200 shadow-md animate-pulse'
                            : isError
                            ? 'bg-red-50 border-red-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className={`p-1 rounded ${
                              isCompleted 
                                ? 'bg-green-100 text-green-600' 
                                : isActive
                                ? 'bg-orange-100 text-orange-600'
                                : isError
                                ? 'bg-red-100 text-red-600'
                                : 'bg-gray-100 text-gray-400'
                            }`}>
                              {getAgentIcon(agent)}
                            </div>
                            <span className="font-medium text-sm text-gray-800 capitalize">
                              {getAgentDisplayName(agent)}
                            </span>
                          </div>
                          <div className={`w-2 h-2 rounded-full ${getAgentStatusColor(status)}`}></div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <span className={`font-medium capitalize ${
                            isCompleted ? 'text-green-600' :
                            isActive ? 'text-orange-600' :
                            isError ? 'text-red-600' :
                            'text-gray-500'
                          }`}>
                            {status}
                          </span>
                          {agent === 'speaker' && isCompleted && (
                            <Shield className="h-3 w-3 text-green-500" />
                          )}
                          {agent === 'image' && isCompleted && (
                            <Image className="h-3 w-3 text-purple-500" />
                          )}
                        </div>

                        {/* Progress indicator for active agents */}
                        {isActive && (
                          <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                            <div className="bg-orange-500 h-1 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Real-time Updates Notice */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="rounded-full bg-blue-500 p-2 text-white">
                      <Sparkles className="h-4 w-4" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Real-time Updates Active</h4>
                    <p className="text-sm text-gray-600">
                      Progress updates are streamed live from our AI agents. The page will automatically update as each agent completes its task.
                    </p>
                  </div>
                </div>
              </div>

              {/* Enhanced Features Notice */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="rounded-full bg-green-500 p-2 text-white">
                      <Shield className="h-5 w-5" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Enhanced AI Features Active</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-green-500" />
                        <span>Real speaker verification with Google Search</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Image className="h-4 w-4 text-purple-500" />
                        <span>AI-generated event thumbnails</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        <span>Anti-hallucination safeguards</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                        <span>Confidence scoring for speakers</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estimated Time */}
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-2">
                  {currentProgress.percentage < 50 
                    ? "Initializing AI agents and structuring your event..." 
                    : currentProgress.percentage < 85
                    ? "Researching real speaker data and generating content..."
                    : "Finalizing event details and generating visuals..."
                  }
                </p>
                <p className="text-xs text-gray-400">
                  This usually takes 1-2 minutes. Please don't close this window.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </CreatorLayout>
  );
};

export default CreatorEventCreateWithAI;
