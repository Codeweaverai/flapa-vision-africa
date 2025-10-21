import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bot, Sparkles, Calendar, Clock, Users, Zap, CheckCircle, ArrowRight, Play, Star, MapPin, Ticket, Mic, Plus, X, User, Music, Camera, Image, Shield, AlertCircle, History, Trash2, Copy } from 'lucide-react';
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

// Custom hook for fetching past proposals
const usePastProposals = (userId: string | undefined) => {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchProposals = async () => {
      const { data, error } = await supabase
        .from('ai_event_proposals')
        .select('*')
        .eq('creator_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching proposals:', error);
      } else {
        setProposals(data || []);
      }
      setLoading(false);
    };

    fetchProposals();
  }, [userId]);

  return { proposals, loading };
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
  
  const [detailedPrompt, setDetailedPrompt] = useState('');
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
  const [showPastGenerations, setShowPastGenerations] = useState(false);
  
  // Use the progress tracking hook
  const { progress: realTimeProgress, loading: progressLoading } = useAIProgress(progressId);
  
  // Use the past proposals hook
  const { proposals: pastProposals, loading: pastProposalsLoading } = usePastProposals(user?.id);

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
    // Use detailed prompt if provided, otherwise use structured form data
    const promptToUse = detailedPrompt.trim() || buildPromptFromFormData();

    if (!promptToUse) {
      toast.error('Please provide event details or use the detailed description field');
      return;
    }

    setLoading(true);
    setStep('generating');

    try {
      const { data, error } = await supabase.functions.invoke('generate-event', {
        body: {
          user_prompt: promptToUse,
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

  const buildPromptFromFormData = () => {
    const validSpeakers = speakers.filter(s => s.name.trim() !== '');
    if (validSpeakers.length === 0) {
      toast.error('Please add at least one speaker or performer');
      return '';
    }

    const speakerDetails = validSpeakers.map(speaker => 
      `Name: ${speaker.name}, Role: ${speaker.role}, Expertise: ${speaker.expertise}, LinkedIn: ${speaker.linkedinUrl || 'Not provided'}, Twitter: ${speaker.twitterUrl || 'Not provided'}, Website: ${speaker.websiteUrl || 'Not provided'}`
    ).join('\n');

    return `Create a comprehensive event about: ${eventData.title}
      
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

  const loadPastProposal = (pastProposal: any) => {
    setDetailedPrompt(`Create an event with these details:
${JSON.stringify(pastProposal.proposal_data, null, 2)}`);
    setShowPastGenerations(false);
    toast.success('Past proposal loaded into description field');
  };

  const deletePastProposal = async (proposalId: string) => {
    try {
      const { error } = await supabase
        .from('ai_event_proposals')
        .delete()
        .eq('id', proposalId);

      if (error) throw error;

      toast.success('Proposal deleted successfully');
      // The list will update automatically due to the hook
    } catch (error: any) {
      console.error('Error deleting proposal:', error);
      toast.error('Failed to delete proposal');
    }
  };

  const copyProposalToClipboard = (proposalData: any) => {
    const text = JSON.stringify(proposalData, null, 2);
    navigator.clipboard.writeText(text);
    toast.success('Proposal copied to clipboard');
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
          <div className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <CardTitle className={`text-2xl font-bold ${gradientTextClass}`}>
                  Describe Your Event
                </CardTitle>
                <CardDescription className="text-lg">
                  Provide detailed information about your event or use the form below
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Detailed Description Input */}
                <div className="space-y-3">
                  <Label htmlFor="detailedPrompt" className="text-base font-semibold">
                    Detailed Event Description (Recommended)
                  </Label>
                  <Textarea
                    id="detailedPrompt"
                    placeholder={`Example: Create a 2-hour virtual tech webinar about AI innovation happening on March 15, 2025. Target audience: developers and product managers. Ticket price: $15. Include speakers: Elon Musk (CEO of Tesla, Twitter: @elonmusk), Satya Nadella (CEO of Microsoft, LinkedIn: linkedin.com/in/satyanadella). Topics: AI trends, machine learning, future of technology. Location: Virtual event with Google Meet integration.`}
                    rows={6}
                    value={detailedPrompt}
                    onChange={(e) => setDetailedPrompt(e.target.value)}
                    className="border-2 focus:border-orange-300 resize-none transition-colors text-base"
                  />
                  <p className="text-sm text-gray-600">
                    Include: Event title, description, dates, duration, pricing, target audience, speakers with social links, topics, and location.
                  </p>
                </div>

                <div className="flex items-center">
                  <div className="flex-1 border-t border-gray-300"></div>
                  <span className="px-4 text-gray-500 text-sm">OR use form</span>
                  <div className="flex-1 border-t border-gray-300"></div>
                </div>

                {/* Existing Form Fields */}
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
                    rows={3}
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
                          <span>Real speaker verification with Google Search</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Image className="h-4 w-4 text-purple-500" />
                          <span>AI-generated event thumbnails</span>
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
                  disabled={loading || (!detailedPrompt.trim() && (!eventData.title.trim() || !eventData.description.trim() || speakers.every(s => !s.name.trim())))}
                  className={`w-full ${gradientClass} text-white font-semibold py-3 rounded-lg ${gradientHoverClass} transition-all duration-200 shadow-lg hover:shadow-xl`}
                >
                  <Bot className="h-5 w-5 mr-2" />
                  {loading ? 'Generating Proposal...' : 'Generate Event Proposal'}
                </Button>

                {/* Past Generations Toggle */}
                <div className="text-center">
                  <Button
                    variant="ghost"
                    onClick={() => setShowPastGenerations(!showPastGenerations)}
                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                  >
                    <History className="h-4 w-4 mr-2" />
                    {showPastGenerations ? 'Hide Past Generations' : 'Show Past Generations'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Past Generations Section */}
            {showPastGenerations && (
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <History className="h-5 w-5 mr-2 text-orange-500" />
                    Your Past Event Proposals
                  </CardTitle>
                  <CardDescription>
                    Previously generated event proposals that you can reuse or reference
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pastProposalsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                      <p className="text-gray-600 mt-2">Loading past proposals...</p>
                    </div>
                  ) : pastProposals.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No past proposals found</p>
                      <p className="text-sm">Your generated proposals will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pastProposals.map((proposal) => (
                        <Card key={proposal.id} className="border border-gray-200 hover:border-orange-300 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg text-gray-900">
                                  {proposal.proposal_data.event_title}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  {proposal.proposal_data.event_description}
                                </p>
                                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                  <span>Type: {proposal.proposal_data.event_type}</span>
                                  <span>•</span>
                                  <span>Price: ${proposal.proposal_data.price}</span>
                                  <span>•</span>
                                  <span>
                                    Created: {new Date(proposal.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex space-x-2 ml-4">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => loadPastProposal(proposal)}
                                  className="h-8 text-orange-600 border-orange-300 hover:bg-orange-50"
                                >
                                  Use
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyProposalToClipboard(proposal.proposal_data)}
                                  className="h-8"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deletePastProposal(proposal.id)}
                                  className="h-8 text-red-600 border-red-300 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
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
