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
    if (!progressId) return;

    const subscription = supabase
      .channel('ai-progress')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_generation_progress',
          filter: `id=eq.${progressId}`
        },
        (payload) => {
          setProgress(payload.new);
          setLoading(false);
        }
      )
      .subscribe();

    // Fetch initial progress
    const fetchProgress = async () => {
      const { data } = await supabase
        .from('ai_generation_progress')
        .select('*')
        .eq('id', progressId)
        .single();
      
      if (data) {
        setProgress(data);
      }
      setLoading(false);
    };

    fetchProgress();

    return () => {
      subscription.unsubscribe();
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
    maxPrice: '25' // Default max price
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

    // Validate speakers
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
        toast.success('Event created successfully with AI Agents!');
        navigate(`/creator/events/${data.event_id}/edit`);
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
      setProgressId(null);
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

  // Use real-time progress data if available, otherwise fallback to static progress
  const currentProgress = realTimeProgress ? {
    percentage: realTimeProgress.progress_percentage,
    step: realTimeProgress.current_step,
    agentActivity: realTimeProgress.agent_activity
  } : {
    percentage: 0,
    step: 'Initializing...',
    agentActivity: null
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-base font-semibold">Event Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Tech Innovation Summit 2024"
                    value={eventData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="h-12 border-2 focus:border-orange-300 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventType" className="text-base font-semibold">Event Type</Label>
                  <select
                    id="eventType"
                    className="w-full px-3 py-3 border-2 border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                    value={eventData.eventType}
                    onChange={(e) => handleInputChange('eventType', e.target.value)}
                  >
                    {eventTypes.map(type => (
                      <option key={type} value={type}>
                        {type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-semibold">Event Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what attendees can expect from your event..."
                  rows={4}
                  value={eventData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="border-2 focus:border-orange-300 resize-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="targetAudience" className="text-base font-semibold">Target Audience</Label>
                  <Input
                    id="targetAudience"
                    placeholder="e.g., Tech professionals, entrepreneurs"
                    value={eventData.targetAudience}
                    onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                    className="border-2 focus:border-orange-300 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-base font-semibold">Estimated Duration</Label>
                  <Input
                    id="duration"
                    placeholder="e.g., 2 hours, full day, 3 days"
                    value={eventData.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                    className="border-2 focus:border-orange-300 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-base font-semibold">Location Type</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Virtual, New York City, Hybrid"
                    value={eventData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="border-2 focus:border-orange-300 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxPrice" className="text-base font-semibold">Maximum Ticket Price ($3-$40)</Label>
                  <Input
                    id="maxPrice"
                    type="number"
                    min="3"
                    max="40"
                    placeholder="25"
                    value={eventData.maxPrice}
                    onChange={(e) => handleInputChange('maxPrice', e.target.value)}
                    className="border-2 focus:border-orange-300 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="keyTopics" className="text-base font-semibold">Key Topics/Themes</Label>
                <Input
                  id="keyTopics"
                  placeholder="e.g., AI, Innovation, Sustainability"
                  value={eventData.keyTopics}
                  onChange={(e) => handleInputChange('keyTopics', e.target.value)}
                  className="border-2 focus:border-orange-300 transition-colors"
                />
              </div>

              {/* Speakers/Performers Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-semibold">Speakers & Performers *</Label>
                    <p className="text-sm text-gray-600 flex items-center">
                      <Shield className="h-3 w-3 mr-1 text-green-500" />
                      Real speaker verification enabled
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={addSpeaker}
                    variant="outline"
                    size="sm"
                    className="border-orange-300 text-orange-600 hover:bg-orange-50"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Speaker
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {speakers.map((speaker, index) => (
                    <Card key={speaker.id} className="border-2 border-orange-100 bg-orange-50/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            {getRoleIcon(speaker.role)}
                            <span className="font-medium text-sm text-orange-800">
                              {speakerRoles.find(r => r.value === speaker.role)?.label}
                            </span>
                          </div>
                          {speakers.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => removeSpeaker(speaker.id)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Full Name *</Label>
                            <Input
                              placeholder="e.g., Elon Musk, Taylor Swift"
                              value={speaker.name}
                              onChange={(e) => updateSpeaker(speaker.id, 'name', e.target.value)}
                              className="border-orange-200 focus:border-orange-400"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Role</Label>
                            <select
                              value={speaker.role}
                              onChange={(e) => updateSpeaker(speaker.id, 'role', e.target.value)}
                              className="w-full px-3 py-2 border border-orange-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            >
                              {speakerRoles.map(role => (
                                <option key={role.value} value={role.value}>
                                  {role.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <Label className="text-sm font-medium">Expertise/Specialization</Label>
                          <Input
                            placeholder="e.g., AI Research, Pop Music, Digital Art"
                            value={speaker.expertise}
                            onChange={(e) => updateSpeaker(speaker.id, 'expertise', e.target.value)}
                            className="border-orange-200 focus:border-orange-400"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">LinkedIn URL</Label>
                            <Input
                              placeholder="https://linkedin.com/in/..."
                              value={speaker.linkedinUrl}
                              onChange={(e) => updateSpeaker(speaker.id, 'linkedinUrl', e.target.value)}
                              className="border-orange-200 focus:border-orange-400"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Twitter URL</Label>
                            <Input
                              placeholder="https://twitter.com/..."
                              value={speaker.twitterUrl}
                              onChange={(e) => updateSpeaker(speaker.id, 'twitterUrl', e.target.value)}
                              className="border-orange-200 focus:border-orange-400"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Website/Portfolio</Label>
                            <Input
                              placeholder="https://example.com"
                              value={speaker.websiteUrl}
                              onChange={(e) => updateSpeaker(speaker.id, 'websiteUrl', e.target.value)}
                              className="border-orange-200 focus:border-orange-400"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* AI Features Notice */}
              <div className="bg-gradient-to-r from-purple-50 to-orange-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`rounded-full ${gradientClass} p-2 text-white`}>
                      <Bot className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-800">AI-Powered Event Creation</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-green-500" />
                        <span>Real speaker verification</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Image className="h-4 w-4 text-purple-500" />
                        <span>AI-generated event banners</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Camera className="h-4 w-4 text-orange-500" />
                        <span>Speaker portrait generation</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                        <span>Anti-hallucination safeguards</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

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
              {/* Event Overview */}
              <div className="bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg p-6 border border-orange-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`rounded-lg ${gradientClass} p-2 text-white`}>
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{proposal.event_title}</h3>
                      <p className="text-gray-700 mt-1">{proposal.event_description}</p>
                    </div>
                  </div>
                  <Badge className={`${gradientClass} text-white border-0`}>
                    {proposal.event_type}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center p-3 bg-white rounded-lg border border-orange-100">
                    <Clock className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                    <p className="font-semibold text-gray-900">
                      {new Date(proposal.start_time).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-600">Date</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-orange-100">
                    <Users className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                    <p className="font-semibold text-gray-900">{proposal.capacity}</p>
                    <p className="text-xs text-gray-600">Capacity</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-orange-100">
                    <MapPin className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                    <p className="font-semibold text-gray-900 truncate">{proposal.location}</p>
                    <p className="text-xs text-gray-600">Location</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-orange-100">
                    <Ticket className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                    <p className="font-semibold text-gray-900">
                      {proposal.is_free ? 'Free' : `$${proposal.price}`}
                    </p>
                    <p className="text-xs text-gray-600">Price</p>
                  </div>
                </div>
              </div>

              {/* Learning Objectives */}
              {proposal.learning_objectives && proposal.learning_objectives.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-semibold text-lg mb-3 flex items-center">
                    <Star className="h-5 w-5 mr-2 text-orange-500" />
                    Key Objectives
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {proposal.learning_objectives.slice(0, 6).map((objective: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{objective}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Enhanced AI Agent Features */}
              <div className="bg-gradient-to-r from-purple-50 to-orange-50 rounded-lg p-4 border border-purple-200">
                <h4 className="font-semibold text-lg mb-3 flex items-center">
                  <Bot className="h-5 w-5 mr-2 text-purple-500" />
                  AI Agent System Features
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Manager Agent coordination</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Complete event agenda</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span>Real speaker verification</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Image className="h-4 w-4 text-purple-500" />
                    <span>AI-generated event banners</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Camera className="h-4 w-4 text-orange-500" />
                    <span>Speaker portrait generation</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Affordable pricing ($3-$40)</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
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

        {/* Step 4: Creating Event with Real-time Progress */}
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
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Progress</span>
                  <span>{currentProgress.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${currentProgress.percentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Current Step */}
              <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg border border-orange-200">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Bot className="h-5 w-5 text-orange-500" />
                  <h4 className="font-semibold text-gray-800">Current Step</h4>
                </div>
                <p className="text-lg font-medium text-gray-900">{currentProgress.step}</p>
              </div>

              {/* Agent Activity */}
              <div className="space-y-3">
                <h5 className="font-semibold text-gray-800 flex items-center">
                  <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
                  AI Agent Activity
                </h5>
                <div className="space-y-2 text-sm">
                  {['manager', 'structure', 'agenda', 'speaker', 'ticket', 'image'].map((agent) => (
                    <div key={agent} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${getAgentStatusColor(getAgentStatus(agent))}`}></div>
                        <span className="capitalize">{getAgentDisplayName(agent)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {agent === 'speaker' && getAgentStatus(agent) === 'completed' && (
                          <Shield className="h-3 w-3 text-green-500" />
                        )}
                        {agent === 'image' && getAgentStatus(agent) === 'completed' && (
                          <Image className="h-3 w-3 text-purple-500" />
                        )}
                        <span className="text-xs text-gray-500 capitalize">{getAgentStatus(agent)}</span>
                      </div>
                    </div>
                  ))}
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
                        <span>Real speaker verification</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Image className="h-4 w-4 text-purple-500" />
                        <span>AI-generated visuals</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        <span>Anti-hallucination safeguards</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                        <span>Confidence scoring</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center pt-4">
                <p className="text-sm text-gray-500">
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
