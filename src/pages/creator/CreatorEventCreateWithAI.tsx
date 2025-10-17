import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bot, Sparkles, Calendar, Clock, Users, Zap, CheckCircle, ArrowRight, Play, Star, MapPin, Ticket, Mic } from 'lucide-react';
import { toast } from 'sonner';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

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
    keyTopics: ''
  });
  const [proposal, setProposal] = useState<any>(null);
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [creationProgress, setCreationProgress] = useState({
    percentage: 0,
    step: 'Initializing...'
  });

  const handleInputChange = (field: string, value: string) => {
    setEventData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateProposal = async () => {
    if (!eventData.title.trim() || !eventData.description.trim()) {
      toast.error('Please provide at least an event title and description');
      return;
    }

    setLoading(true);
    setStep('generating');

    try {
      const prompt = `Create a comprehensive event about: ${eventData.title}
      
Description: ${eventData.description}
Event Type: ${eventData.eventType}
Target Audience: ${eventData.targetAudience}
Duration: ${eventData.duration}
Location: ${eventData.location}
Key Topics: ${eventData.keyTopics}

Please generate a detailed event proposal with agenda, speakers, and tickets.`;

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
    
    // Reset progress
    setCreationProgress({
      percentage: 0,
      step: 'Initializing Manager Agent...'
    });

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
      icon: <Mic className="h-5 w-5" />,
      title: "Speaker Profiles",
      description: "Realistic speakers with bios and social links"
    },
    {
      icon: <Ticket className="h-5 w-5" />,
      title: "Smart Ticketing",
      description: "Multiple ticket types with optimal pricing"
    }
  ];

  const eventTypes = [
    'webinar', 'conferences', 'live-music', 'sports-events', 'night-life',
    'concerts', 'comedy-shows', 'business-events', 'wellness-events', 'summit',
    'workshops', 'festivals', 'tech-meetups', 'cultural-events'
  ];

  const gradientClass = "bg-gradient-to-r from-orange-500 to-purple-600";
  const gradientTextClass = "bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent";
  const gradientHoverClass = "hover:from-orange-600 hover:to-purple-700";

  const progressSteps = [
    { percentage: 10, step: 'Structure Generation', description: 'Creating event framework and details' },
    { percentage: 30, step: 'Agenda Creation', description: 'Building comprehensive event schedule' },
    { percentage: 50, step: 'Speaker Research', description: 'Generating speaker profiles with bios' },
    { percentage: 70, step: 'Ticket Setup', description: 'Creating optimal ticket types and pricing' },
    { percentage: 95, step: 'Final Assembly', description: 'Combining all components' },
    { percentage: 98, step: 'Database Save', description: 'Saving to database' },
    { percentage: 100, step: 'Completed', description: 'Event ready!' }
  ];

  const getCurrentProgressStep = () => {
    return progressSteps.find(step => step.percentage <= creationProgress.percentage) || progressSteps[0];
  };

  return (
    <CreatorLayout title="Create Event with AI">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center items-center space-x-3">
            <div className={`rounded-full ${gradientClass} p-3 shadow-lg`}>
              <Bot className="h-8 w-8 text-white" />
            </div>
            <Sparkles className="h-8 w-8 text-orange-500" />
          </div>
          <h1 className={`text-4xl font-bold ${gradientTextClass}`}>
            AI Event Creator
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Let our AI Manager Agent create a complete, production-ready event for you
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                Provide some details about the event you want to create
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
                  <Label htmlFor="keyTopics" className="text-base font-semibold">Key Topics/Themes</Label>
                  <Input
                    id="keyTopics"
                    placeholder="e.g., AI, Innovation, Sustainability"
                    value={eventData.keyTopics}
                    onChange={(e) => handleInputChange('keyTopics', e.target.value)}
                    className="border-2 focus:border-orange-300 transition-colors"
                  />
                </div>
              </div>

              <Button
                onClick={generateProposal}
                disabled={loading || !eventData.title.trim() || !eventData.description.trim()}
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
              <p className="text-gray-600 mb-4">Our AI is crafting a comprehensive event structure...</p>
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

              {/* AI Agent Features */}
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
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Speaker profiles with bios</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Multiple ticket types</span>
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

        {/* Step 4: Creating Event */}
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
                  <span>{creationProgress.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${creationProgress.percentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Current Step */}
              <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg border border-orange-200">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Bot className="h-5 w-5 text-orange-500" />
                  <h4 className="font-semibold text-gray-800">Current Step</h4>
                </div>
                <p className="text-lg font-medium text-gray-900">{getCurrentProgressStep().step}</p>
                <p className="text-sm text-gray-600 mt-1">{getCurrentProgressStep().description}</p>
              </div>

              {/* Agent Activity */}
              <div className="space-y-3">
                <h5 className="font-semibold text-gray-800 flex items-center">
                  <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
                  AI Agent Activity
                </h5>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>Manager Agent</span>
                    </div>
                    <span className="text-xs text-gray-500">Coordinating</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                      <span>Structure Agent</span>
                    </div>
                    <span className="text-xs text-gray-500">Active</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      <span>Agenda Agent</span>
                    </div>
                    <span className="text-xs text-gray-500">Pending</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      <span>Speaker Agent</span>
                    </div>
                    <span className="text-xs text-gray-500">Pending</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      <span>Ticket Agent</span>
                    </div>
                    <span className="text-xs text-gray-500">Pending</span>
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
