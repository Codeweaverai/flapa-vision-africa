import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bot, Sparkles, Calendar, Clock, Users, Zap, CheckCircle, ArrowRight, Play, Star, MapPin, Ticket, Mic, Plus, X, User, Music, Camera, Image, Shield, AlertCircle, History, Trash2, Copy, Coins, Gift, Brain, Rocket, Search, Lightbulb, Target, BookOpen, Cpu, Layers, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useTokens } from '@/hooks/useTokens';
import TokenUsageDialog from '@/components/creator/TokenUsageDialog';
import FreeTrialBanner from '@/components/creator/FreeTrialBanner';

// Safe token hook wrapper
const useSafeTokens = () => {
  const tokenHook = useTokens();
  
  const safeHasEnoughTokens = (cost: number) => {
    if (typeof tokenHook.hasEnoughTokens === 'function') {
      return tokenHook.hasEnoughTokens(cost);
    }
    console.warn('hasEnoughTokens is not available');
    return false;
  };

  const safeDeductTokens = async (featureType: string, referenceId?: string) => {
    if (typeof tokenHook.deductTokens === 'function') {
      return await tokenHook.deductTokens(featureType, referenceId);
    }
    console.warn('deductTokens is not available, proceeding without token deduction');
    return { success: true, tokensUsed: 0, wasFree: false, remainingTokens: 0 };
  };

  const safeGetFeatureCost = async (featureType: string) => {
    if (typeof tokenHook.getFeatureCost === 'function') {
      return await tokenHook.getFeatureCost(featureType);
    }
    return featureType === 'event_proposal' ? 6 : 20;
  };

  const safeGetAvailableTokens = () => {
    if (typeof tokenHook.getAvailableTokens === 'function') {
      return tokenHook.getAvailableTokens();
    }
    return { free: 0, paid: 0 };
  };

  const safeRefetchTokens = () => {
    if (typeof tokenHook.refetch === 'function') {
      return tokenHook.refetch();
    }
    return Promise.resolve();
  };

  return {
    ...tokenHook,
    hasEnoughTokens: safeHasEnoughTokens,
    deductTokens: safeDeductTokens,
    getFeatureCost: safeGetFeatureCost,
    getAvailableTokens: safeGetAvailableTokens,
    refetch: safeRefetchTokens,
  };
};

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
  const { 
    tokenBalance, 
    hasEnoughTokens, 
    deductTokens, 
    getFeatureCost, 
    getAvailableTokens, 
    refetch: refetchTokens 
  } = useSafeTokens();

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'generating' | 'proposal' | 'creating'>('input');
  const [detailedPrompt, setDetailedPrompt] = useState('');
  const [proposal, setProposal] = useState<any>(null);
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [progressId, setProgressId] = useState<string | null>(null);
  const [showPastGenerations, setShowPastGenerations] = useState(false);
  const [functionError, setFunctionError] = useState<string | null>(null);
  const [typingIndex, setTypingIndex] = useState(0);
  
  // Token usage states
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [requiredTokens, setRequiredTokens] = useState(0);
  const [featureName, setFeatureName] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Use the progress tracking hook
  const { progress: realTimeProgress, loading: progressLoading } = useAIProgress(progressId);
  
  // Use the past proposals hook
  const { proposals: pastProposals, loading: pastProposalsLoading } = usePastProposals(user?.id);

  // Example prompts for typing animation
  const examplePrompts = [
    "Create a 2-hour virtual tech webinar about AI innovation happening on March 15, 2025. Target audience: developers and product managers. Ticket price: $15. Include speakers: Elon Musk (CEO of Tesla), Satya Nadella (CEO of Microsoft). Topics: AI trends, machine learning, future of technology.",
    "Design a weekend music festival in Central Park featuring popular indie artists and established performers. Include food vendors, multiple stages, and VIP experiences. Target audience: young adults and music enthusiasts. Ticket prices: $25-$75.",
    "Organize a business networking conference for entrepreneurs and investors in the tech startup ecosystem. Include keynote speakers, pitch sessions, and workshops on fundraising and growth strategies. Location: San Francisco. Duration: 2 days.",
    "Create a wellness retreat focused on mindfulness and yoga in a natural setting. Include meditation sessions, yoga classes, healthy meals, and workshops on stress management. Target audience: professionals seeking work-life balance.",
    "Plan a corporate team-building event with interactive workshops, group activities, and professional development sessions. Focus on communication skills, leadership, and collaboration. Duration: 1 day. Location: company headquarters.",
    "Design a food and wine tasting event featuring local chefs and wineries. Include cooking demonstrations, wine pairings, and gourmet food stations. Target audience: food enthusiasts and culinary professionals.",
    "Organize a charity gala fundraiser for environmental conservation. Include celebrity guests, auction items, dinner, and entertainment. Target audience: philanthropists and corporate sponsors.",
    "Create a professional development workshop series for digital marketing professionals. Cover SEO, social media strategy, content marketing, and analytics. Include hands-on exercises and case studies.",
    "Plan a community cultural festival celebrating diversity through music, dance, food, and art. Include performances, workshops, and international cuisine. Family-friendly event.",
    "Design a tech product launch event with live demonstrations, keynote presentations, and hands-on experience zones. Include media coverage and influencer partnerships."
  ];

  // Typing animation effect
  useEffect(() => {
    if (step === 'input' && !detailedPrompt) {
      const interval = setInterval(() => {
        setTypingIndex((prev) => (prev + 1) % examplePrompts.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [step, detailedPrompt]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [detailedPrompt]);

  const checkTokensAndProceed = async (action: 'proposal' | 'full_event', callback: () => void) => {
    try {
      const featureType = action === 'proposal' ? 'event_proposal' : 'full_event';
      const cost = await getFeatureCost(featureType);
      const featureName = action === 'proposal' ? 'Event Proposal' : 'Full Event Creation';
      
      setRequiredTokens(cost);
      setFeatureName(featureName);
      
      if (hasEnoughTokens(cost)) {
        callback();
      } else {
        setPendingAction(() => callback);
        setShowTokenDialog(true);
      }
    } catch (error) {
      console.error('Error checking token cost:', error);
      toast.error('Unable to verify token requirements');
    }
  };

  const generateProposal = async () => {
    if (!detailedPrompt.trim()) {
      toast.error('Please describe the event you want to create');
      return;
    }

    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    setLoading(true);
    setStep('generating');
    setFunctionError(null);

    try {
      const tokenResult = await deductTokens('event_proposal', `event_proposal_${Date.now()}`);
      
      console.log('Calling generate-event function for proposal...');
      const { data, error } = await supabase.functions.invoke('generate-event', {
        body: {
          user_prompt: detailedPrompt,
          creator_id: user.id,
          action: 'generate_proposal'
        }
      });

      if (error) {
        console.error('Function call error:', error);
        throw new Error(error.message || 'Failed to generate proposal');
      }

      if (data?.success) {
        setProposal(data.proposal);
        setProposalId(data.proposal_id);
        setStep('proposal');
        
        let successMessage = 'Event proposal generated successfully!';
        if (tokenResult?.wasFree) successMessage += ' (Used free tokens)';
        
        toast.success(successMessage);
      } else {
        throw new Error(data?.error || 'Failed to generate proposal');
      }
    } catch (error: any) {
      console.error('Error generating proposal:', error);
      
      let errorMessage = error.message || 'Failed to generate event proposal';
      
      if (error.message?.includes('Insufficient tokens')) {
        errorMessage = 'Insufficient tokens to generate event proposal';
        await refetchTokens();
      } else if (error.message?.includes('Edge Function')) {
        errorMessage = 'AI service temporarily unavailable. Please try again.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      }
      
      toast.error(errorMessage);
      setStep('input');
      setFunctionError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createFullEvent = async () => {
    if (!proposal || !proposalId) {
      toast.error('No proposal found to create event from');
      return;
    }

    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    setLoading(true);
    setStep('creating');
    setFunctionError(null);

    try {
      const tokenResult = await deductTokens('full_event', `full_event_${proposalId}`);
      
      console.log('Calling generate-event function for full event...');
      const { data, error } = await supabase.functions.invoke('generate-event', {
        body: {
          creator_id: user.id,
          action: 'generate_full_event',
          proposal_id: proposalId
        }
      });

      if (error) {
        console.error('Function call error:', error);
        throw new Error(error.message || 'Failed to create event');
      }

      if (data?.success) {
        console.log('✅ Event creation completed successfully');
        toast.success('Event created successfully with multi-agent system!');
        
        await refetchTokens();
        setTimeout(() => {
          navigate(`/creator/events/${data.event_id}/edit`);
        }, 2000);
      } else {
        throw new Error(data?.error || 'Failed to create event');
      }
    } catch (error: any) {
      console.error('Error creating event:', error);
      
      let errorMessage = error.message || 'Failed to create event. Please try again.';
      
      if (error.message?.includes('Insufficient tokens')) {
        errorMessage = 'Insufficient tokens to create full event';
        await refetchTokens();
        setStep('proposal');
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Event generation is taking longer than expected. Please try again.';
        setStep('proposal');
      } else if (error.message?.includes('Edge Function')) {
        errorMessage = 'AI service temporarily unavailable. Please try again in a moment.';
        setStep('proposal');
      }
      
      toast.error(errorMessage);
      setFunctionError(errorMessage);
      setStep('proposal');
    } finally {
      setLoading(false);
    }
  };

  const searchSimilarProposals = async () => {
    if (!detailedPrompt.trim()) {
      toast.error('Please enter a prompt to search for similar proposals');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('generate-event', {
        body: {
          user_prompt: detailedPrompt,
          creator_id: user.id,
          action: 'search_similar_proposals'
        }
      });

      if (error) throw new Error(error.message);
      
      if (data?.success) {
        toast.success(`Found ${data.count} similar proposals`);
        console.log('Similar proposals:', data.similar_proposals);
      }
    } catch (error: any) {
      console.error('Error searching proposals:', error);
      toast.error('Failed to search similar proposals');
    }
  };

  const handleGenerateProposal = () => {
    checkTokensAndProceed('proposal', generateProposal);
  };

  const handleCreateFullEvent = () => {
    checkTokensAndProceed('full_event', createFullEvent);
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

  // Gradient utilities
  const gradientClass = "bg-gradient-to-r from-orange-500 to-purple-600";
  const gradientTextClass = "bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent";
  const gradientHoverClass = "hover:from-orange-600 hover:to-purple-700";

  const availableTokens = getAvailableTokens();

  return (
    <CreatorLayout title="Create Event with Lumo AI">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Free Trial Banner */}
        <FreeTrialBanner />

        {/* Header */}
        <div className="text-center space-y-6">
          <div className="flex justify-center items-center space-x-4 mb-4">
            <div className={`rounded-2xl ${gradientClass} p-4 shadow-2xl relative`}>
              <Bot className="h-8 w-8 text-white" />
              <div className="absolute -top-1 -right-1">
                <div className="rounded-full bg-green-500 p-1 animate-pulse">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
          </div>
          <h1 className={`text-5xl font-bold ${gradientTextClass} mb-4`}>
            Lumo AI
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Transform your ideas into complete, engaging events with intelligent AI analysis
          </p>
          
          {/* Feature Badges */}
          <div className="flex justify-center gap-4 flex-wrap">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Cpu className="h-3 w-3 mr-1" />
              Multi-Agent System
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              <Layers className="h-3 w-3 mr-1" />
              Smart Context
            </Badge>
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              <Brain className="h-3 w-3 mr-1" />
              AI Powered
            </Badge>
          </div>
        </div>

        {/* Error Display */}
        {functionError && (
          <Card className="border-0 shadow-xl bg-red-50 border-l-4 border-l-red-500 animate-pulse">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-xl text-red-700">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Operation Failed
              </CardTitle>
              <CardDescription className="text-red-600">
                {functionError}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => {
                  setFunctionError(null);
                  setStep('input');
                }}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Main Input Section */}
        {step === 'input' && !functionError && (
          <div className="space-y-8">
            {/* Token Balance Card */}
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`rounded-xl ${gradientClass} p-3 shadow-lg`}>
                      <Coins className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">AI Tokens Available</h3>
                      <p className="text-sm text-gray-600">Create amazing events with Lumo AI</p>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="flex items-center justify-end space-x-3">
                      {availableTokens.free > 0 && !tokenBalance?.has_used_free_trial && (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          <Gift className="h-3 w-3 mr-1" />
                          {availableTokens.free} Free
                        </Badge>
                      )}
                      <div className="flex items-center space-x-2">
                        <div className="text-2xl font-bold text-orange-600">
                          {availableTokens.paid}
                        </div>
                        <span className="text-gray-500">paid</span>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/creator/tokens')}
                      className="text-orange-600 border-orange-300 hover:bg-orange-50"
                    >
                      Get More Tokens
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Input Card */}
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm overflow-hidden">
              <div className={`${gradientClass} p-1`}>
                <div className="bg-white rounded-lg p-1">
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-2xl font-bold text-gray-800">
                      Describe Your Vision
                    </CardTitle>
                    <CardDescription className="text-lg text-gray-600">
                      Tell Lumo AI what event you want to create. Be as detailed as you like!
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Prompt Input */}
                    <div className="relative">
                      <Textarea
                        ref={textareaRef}
                        value={detailedPrompt}
                        onChange={(e) => setDetailedPrompt(e.target.value)}
                        placeholder=""
                        className="min-h-[120px] p-4 text-lg border-2 border-gray-200 rounded-xl resize-none focus:border-orange-300 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                        disabled={loading}
                      />
                      
                      {/* Typing Animation Placeholder */}
                      {!detailedPrompt && (
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="p-4 text-lg text-gray-400">
                            <TypewriterAnimation 
                              text={examplePrompts[typingIndex]}
                              speed={50}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Prompt Tips */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-start space-x-2 p-3 bg-orange-50 rounded-lg">
                        <Lightbulb className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        <span>Include event type and target audience</span>
                      </div>
                      <div className="flex items-start space-x-2 p-3 bg-purple-50 rounded-lg">
                        <Target className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <span>Specify speakers, performers, or special guests</span>
                      </div>
                      <div className="flex items-start space-x-2 p-3 bg-orange-50 rounded-lg">
                        <BookOpen className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        <span>Mention location, date, and ticket pricing</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        onClick={handleGenerateProposal}
                        disabled={loading || !detailedPrompt.trim()}
                        className={`flex-1 ${gradientClass} text-white font-semibold py-4 rounded-xl ${gradientHoverClass} transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-[1.02] text-lg`}
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Analyzing Your Vision...
                          </>
                        ) : (
                          <>
                            <Brain className="h-5 w-5 mr-2" />
                            Generate Event Proposal (6 tokens)
                            <Rocket className="h-5 w-5 ml-2" />
                          </>
                        )}
                      </Button>
                      
                      <Button
                        onClick={searchSimilarProposals}
                        disabled={loading || !detailedPrompt.trim()}
                        variant="outline"
                        className="border-purple-300 text-purple-700 hover:bg-purple-50"
                      >
                        <Search className="h-4 w-4 mr-2" />
                        Find Similar
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </div>
            </Card>

            {/* Past Generations Section */}
            {pastProposals.length > 0 && (
              <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center text-2xl font-bold">
                        <History className="h-6 w-6 mr-3 text-purple-500" />
                        Your AI Event History
                      </CardTitle>
                      <CardDescription className="text-lg">
                        Revisit and modify your previous event proposals
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pastProposals.map((proposalItem) => {
                      const proposalData = proposalItem.proposal_data;
                      
                      return (
                        <div 
                          key={proposalItem.id} 
                          className="flex items-center justify-between p-5 bg-gradient-to-r from-orange-50 to-purple-50 rounded-xl border border-orange-200 hover:border-orange-400 transition-all duration-300 cursor-pointer hover:shadow-lg group"
                          onClick={() => loadPastProposal(proposalItem)}
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-xl ${gradientClass} flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                              <Calendar className="h-6 w-6" />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 group-hover:text-orange-700 transition-colors text-lg">
                                {proposalData.event_title}
                              </h4>
                              <p className="text-gray-600 line-clamp-1 mt-1">{proposalData.event_description}</p>
                              <div className="flex items-center space-x-3 mt-2">
                                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                  {proposalData.event_type}
                                </Badge>
                                <div className="flex items-center text-sm text-gray-500">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {new Date(proposalItem.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-white text-purple-700 border-purple-200 group-hover:bg-purple-50 transition-colors shadow-sm">
                              Click to Reuse
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Generating Proposal */}
        {step === 'generating' && !functionError && (
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm text-center">
            <CardContent className="py-16">
              <div className="relative mx-auto mb-8">
                {/* Enhanced Orbital Animation */}
                <div className="relative w-32 h-32 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-orange-200 animate-ping"></div>
                  <div className="absolute inset-2 rounded-full border-4 border-purple-200 animate-pulse"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-transparent">
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className={`w-6 h-6 rounded-full ${gradientClass} animate-bounce`}></div>
                    </div>
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                      <div className="w-4 h-4 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                  <div className={`absolute inset-4 rounded-full ${gradientClass} flex items-center justify-center`}>
                    <Bot className="h-8 w-8 text-white animate-pulse" />
                  </div>
                </div>
              </div>
              
              <h3 className="text-2xl font-bold mb-4 text-gray-800">
                Lumo AI is Analyzing Your Vision
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto text-lg">
                Understanding your requirements and crafting the perfect event structure...
              </p>
              
              {/* Enhanced Analysis Indicators */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-md mx-auto text-sm text-gray-500">
                <div className="flex items-center justify-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                  <span>Structuring Event</span>
                </div>
                <div className="flex items-center justify-center space-x-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <span>Designing Agenda</span>
                </div>
                <div className="flex items-center justify-center space-x-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                  <span>Researching Speakers</span>
                </div>
              </div>

              {/* Model Indicator */}
              <div className="mt-6">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Multi-Agent System
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Event Creation Loading */}
        {step === 'creating' && !functionError && (
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm text-center">
            <CardContent className="py-16">
              {/* Enhanced Animation */}
              <div className="relative mx-auto mb-8">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-40 h-40 border-4 border-orange-200 rounded-full animate-spin"></div>
                  <div className="w-32 h-32 border-4 border-purple-200 rounded-full animate-spin" style={{ animationDirection: 'reverse' }}></div>
                  <div className="w-24 h-24 border-4 border-blue-200 rounded-full animate-spin"></div>
                </div>
                <div className="relative rounded-full bg-gradient-to-r from-orange-500 to-purple-600 w-24 h-24 flex items-center justify-center mx-auto shadow-2xl">
                  <Bot className="h-10 w-10 text-white animate-bounce" />
                </div>
              </div>
              
              <h3 className="text-3xl font-bold mb-4 text-gray-800">Multi-Agent Event Creation</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto text-lg">
                Lumo AI agents are collaborating to create your complete event...
              </p>
              
              {/* Enhanced Progress Indicators */}
              <div className="max-w-md mx-auto space-y-4">
                {[
                  { task: 'Structure Agent: Designing event framework', agent: '🏗️' },
                  { task: 'Agenda Agent: Creating event schedule', agent: '📅' },
                  { task: 'Speaker Agent: Researching performers', agent: '🎤' },
                  { task: 'Ticket Agent: Setting pricing strategy', agent: '🎫' },
                  { task: 'Image Agent: Generating visuals', agent: '🖼️' },
                  { task: 'Manager Agent: Assembling event', agent: '🎯' }
                ].map((item, index) => (
                  <div key={item.task} className="flex items-center space-x-3 text-left">
                    <div className={`w-3 h-3 rounded-full ${index < 2 ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                    <span className="flex-1 text-gray-700">
                      <span className="mr-2">{item.agent}</span>
                      {item.task}
                    </span>
                    {index < 2 && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </div>
                ))}
              </div>

              {/* Agent System Status */}
              <div className="mt-6">
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  <Cpu className="h-3 w-3 mr-1" />
                  6 AI Agents Collaborating
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Proposal Review */}
        {step === 'proposal' && proposal && !functionError && (
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className={`text-3xl font-bold ${gradientTextClass}`}>
                🎉 Event Blueprint Ready!
              </CardTitle>
              <CardDescription className="text-lg">
                Lumo AI has analyzed your vision and created this comprehensive event structure
              </CardDescription>
              
              {/* Generation Features Used */}
              <div className="flex justify-center gap-2 mt-2">
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  <Cpu className="h-3 w-3 mr-1" />
                  Multi-Agent
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Event Overview */}
              <div className="bg-gradient-to-r from-orange-50 to-purple-50 rounded-2xl p-6 border border-orange-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className={`rounded-xl ${gradientClass} p-3 text-white shadow-lg`}>
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{proposal.event_title}</h3>
                      <p className="text-gray-700 mt-2 text-lg leading-relaxed">{proposal.event_description}</p>
                    </div>
                  </div>
                  <Badge className={`${gradientClass} text-white border-0 text-sm px-3 py-1`}>
                    {proposal.event_type}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center p-4 bg-white rounded-xl border border-orange-100 shadow-sm">
                    <Clock className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                    <p className="font-bold text-gray-900 text-lg">
                      {new Date(proposal.start_time).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-600">Event Date</p>
                  </div>
                  <div className="text-center p-4 bg-white rounded-xl border border-orange-100 shadow-sm">
                    <Users className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                    <p className="font-bold text-gray-900 text-lg">{proposal.capacity}</p>
                    <p className="text-xs text-gray-600">Capacity</p>
                  </div>
                  <div className="text-center p-4 bg-white rounded-xl border border-orange-100 shadow-sm">
                    <MapPin className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                    <p className="font-bold text-gray-900 text-lg truncate">{proposal.location}</p>
                    <p className="text-xs text-gray-600">Location</p>
                  </div>
                  <div className="text-center p-4 bg-white rounded-xl border border-orange-100 shadow-sm">
                    <Ticket className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                    <p className="font-bold text-gray-900 text-lg">
                      {proposal.is_free ? 'Free' : `$${proposal.price}`}
                    </p>
                    <p className="text-xs text-gray-600">Price</p>
                  </div>
                </div>
              </div>

              {/* Learning Objectives */}
              {proposal.learning_objectives && proposal.learning_objectives.length > 0 && (
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h4 className="font-bold text-xl mb-4 flex items-center">
                    <Star className="h-6 w-6 mr-3 text-orange-500" />
                    Key Objectives
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {proposal.learning_objectives.slice(0, 6).map((objective: string, index: number) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 font-medium">{objective}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                <Button
                  onClick={() => {
                    setStep('input');
                    setProposal(null);
                    setProposalId(null);
                  }}
                  variant="outline"
                  className="flex-1 border-2 border-gray-300 hover:border-orange-300 transition-colors py-3 text-lg rounded-xl"
                >
                  Start New Project
                </Button>
                <Button
                  onClick={handleCreateFullEvent}
                  disabled={loading}
                  className={`flex-1 ${gradientClass} text-white font-bold py-3 rounded-xl ${gradientHoverClass} transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-[1.02] text-lg`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Multi-Agent Creation...
                    </>
                  ) : (
                    <>
                      <Cpu className="h-5 w-5 mr-2" />
                      Create Complete Event (20 tokens)
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Token Usage Dialog */}
        <TokenUsageDialog
          open={showTokenDialog}
          onOpenChange={setShowTokenDialog}
          featureType={requiredTokens === 6 ? 'event_proposal' : 'full_event'}
          requiredTokens={requiredTokens}
          featureName={featureName}
          onContinue={pendingAction || (() => {})}
        />
      </div>
    </CreatorLayout>
  );
};

// Typewriter Animation Component
const TypewriterAnimation = ({ text, speed = 50 }: { text: string; speed?: number }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      
      return () => clearTimeout(timer);
    }
  }, [currentIndex, text, speed]);

  return (
    <span>
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  );
};

export default CreatorEventCreateWithAI;
