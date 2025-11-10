import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bot, Sparkles, BookOpen, Clock, Users, Zap, CheckCircle, ArrowRight, Play, Star, FileText, Target, GraduationCap, Coins, Gift, History, Calendar, BarChart3, AlertCircle } from 'lucide-react';
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
    return featureType === 'course_proposal' ? 8 : 25;
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

const CreatorCourseCreateWithAI = () => {
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
  const [progressLoading, setProgressLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'generating' | 'proposal' | 'creating'>('input');
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    targetAudience: '',
    learningGoals: '',
    duration: '',
    difficulty: 'beginner'
  });
  const [proposal, setProposal] = useState<any>(null);
  const [proposalId, setProposalId] = useState<string | null>(null);
  
  // Real-time progress from database
  const [generationProgress, setGenerationProgress] = useState<any>(null);
  const [pastProposals, setPastProposals] = useState<any[]>([]);
  const [currentProgressId, setCurrentProgressId] = useState<string | null>(null);
  
  // Token usage states
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [requiredTokens, setRequiredTokens] = useState(0);
  const [featureName, setFeatureName] = useState('');

  // Create progress record before starting course generation
  const createProgressRecord = async (proposalId: string) => {
    try {
      console.log('Creating progress record for proposal:', proposalId);
      
      const progressData = {
        proposal_id: proposalId,
        user_id: user!.id,
        progress_percentage: 0,
        current_step: 'Initializing Manager Agent...',
        agent_activity: {
          manager: { status: 'active', message: 'Starting course creation process...' },
          structure: { status: 'pending', message: 'Waiting...' },
          content: { status: 'pending', message: 'Waiting...' },
          quiz: { status: 'pending', message: 'Waiting...' },
          transcript: { status: 'pending', message: 'Waiting...' },
          exam: { status: 'pending', message: 'Waiting...' },
          image: { status: 'pending', message: 'Waiting...' }
        }
      };

      const { data, error } = await supabase
        .from('ai_generation_progress')
        .insert(progressData)
        .select()
        .single();

      if (error) {
        console.error('Database error details:', error);
        throw new Error('Failed to create progress record: ' + error.message);
      }
      
      console.log('Progress record created successfully:', data.id);
      return data.id;
    } catch (error) {
      console.error('Error creating progress record:', error);
      throw error;
    }
  };

  // Subscribe to real-time progress updates
  useEffect(() => {
    if (!user?.id) return;

    // Fetch current active progress
    const fetchActiveProgress = async () => {
      try {
        const { data, error } = await supabase
          .from('ai_generation_progress')
          .select('*')
          .eq('user_id', user.id)
          .gte('progress_percentage', 0)
          .lt('progress_percentage', 100)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (data && !error) {
          console.log('Found active progress:', data);
          setGenerationProgress(data);
          setCurrentProgressId(data.id);
          setStep('creating');
          
          // Fetch the associated proposal data using the proposal_id
          if (data.proposal_id) {
            const { data: proposalData } = await supabase
              .from('ai_course_proposals')
              .select('proposal_data')
              .eq('id', data.proposal_id)
              .single();
            
            if (proposalData) {
              setProposal(proposalData.proposal_data);
              setProposalId(data.proposal_id);
            }
          }
        }
      } catch (error) {
        console.log('No active progress found or error:', error);
      }
    };

    fetchActiveProgress();

    // Enhanced subscription to listen for both INSERT and UPDATE events
    const subscription = supabase
      .channel('ai_progress_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // NEW: Listen for new records
          schema: 'public',
          table: 'ai_generation_progress',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('📊 NEW progress record created:', payload);
          
          if (payload.new.progress_percentage < 100) {
            setGenerationProgress(payload.new);
            setCurrentProgressId(payload.new.id);
            setStep('creating');
            
            // Fetch proposal data if we have a proposal_id but no proposal loaded
            if (payload.new.proposal_id && !proposal) {
              const { data: proposalData } = await supabase
                .from('ai_course_proposals')
                .select('proposal_data')
                .eq('id', payload.new.proposal_id)
                .single();
              
              if (proposalData) {
                setProposal(proposalData.proposal_data);
                setProposalId(payload.new.proposal_id);
              }
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*', // Existing update logic
          schema: 'public',
          table: 'ai_generation_progress',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('📊 Real-time progress update:', payload);
          
          if (payload.new.progress_percentage < 100) {
            setGenerationProgress(payload.new);
            setCurrentProgressId(payload.new.id);
            setStep('creating');
            
            // Fetch proposal data if we have a proposal_id but no proposal loaded
            if (payload.new.proposal_id && !proposal) {
              const { data: proposalData } = await supabase
                .from('ai_course_proposals')
                .select('proposal_data')
                .eq('id', payload.new.proposal_id)
                .single();
              
              if (proposalData) {
                setProposal(proposalData.proposal_data);
                setProposalId(payload.new.proposal_id);
              }
            }
          } else if (payload.new.progress_percentage === 100) {
            // Course generation completed
            console.log('Course generation completed!');
            setGenerationProgress(null);
            setCurrentProgressId(null);
            toast.success('Course created successfully!');
            
            // Navigate to courses page after a short delay
            setTimeout(() => {
              navigate('/creator/courses');
            }, 2000);
          } else {
            setGenerationProgress(null);
            setCurrentProgressId(null);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, proposal, navigate]);

  // Fetch past proposals with their progress
  useEffect(() => {
    if (!user?.id) return;

    const fetchPastProposals = async () => {
      const { data, error } = await supabase
        .from('ai_course_proposals')
        .select(`
          *,
          ai_generation_progress!left (
            id,
            progress_percentage,
            current_step,
            updated_at,
            agent_activity
          )
        `)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setPastProposals(data);
      }
    };

    fetchPastProposals();
  }, [user?.id]);

  const handleInputChange = (field: string, value: string) => {
    setCourseData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const checkTokensAndProceed = async (action: 'proposal' | 'full_course', callback: () => void) => {
    try {
      const featureType = action === 'proposal' ? 'course_proposal' : 'full_course';
      const cost = await getFeatureCost(featureType);
      const featureName = action === 'proposal' ? 'Course Proposal' : 'Full Course Creation';
      
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
    if (!courseData.title.trim() || !courseData.description.trim()) {
      toast.error('Please provide at least a course title and description');
      return;
    }

    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    setLoading(true);
    setStep('generating');

    try {
      const prompt = `Create a comprehensive course about: ${courseData.title}
      
Description: ${courseData.description}
Target Audience: ${courseData.targetAudience}
Learning Goals: ${courseData.learningGoals}
Estimated Duration: ${courseData.duration}
Difficulty Level: ${courseData.difficulty}

Please generate a detailed course proposal with modules, lessons, and learning outcomes.`;

      const tokenResult = await deductTokens('course_proposal', `course_proposal_${Date.now()}`);
      
      const { data, error } = await supabase.functions.invoke('generate-course', {
        body: {
          user_prompt: prompt,
          creator_id: user.id,
          action: 'generate_proposal'
        }
      });

      if (error) throw new Error(error.message || 'Failed to generate proposal');

      if (data?.success) {
        // Store proposal in ai_course_proposals table
        const { data: proposalData, error: proposalError } = await supabase
          .from('ai_course_proposals')
          .insert({
            creator_id: user.id,
            proposal_data: data.proposal
          })
          .select()
          .single();

        if (proposalError) throw new Error('Failed to save proposal');

        setProposal(data.proposal);
        setProposalId(proposalData.id);
        setStep('proposal');
        toast.success(`Course proposal generated successfully! ${tokenResult?.wasFree ? '(Used free tokens)' : ''}`);
      } else {
        throw new Error(data?.error || 'Failed to generate proposal');
      }
    } catch (error: any) {
      console.error('Error generating proposal:', error);
      
      if (error.message?.includes('Insufficient tokens')) {
        toast.error('Insufficient tokens to generate course proposal');
        await refetchTokens();
      } else {
        toast.error(error.message || 'Failed to generate course proposal');
      }
      setStep('input');
    } finally {
      setLoading(false);
    }
  };

  const createFullCourse = async () => {
    if (!proposal || !proposalId) {
      toast.error('No proposal found to create course from');
      return;
    }

    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    setProgressLoading(true);
    setLoading(true);
    setStep('creating'); // Set step immediately to show progress UI

    try {
      // Create progress record FIRST with proposal_id
      console.log('Creating progress record for proposal:', proposalId);
      const progressId = await createProgressRecord(proposalId);
      setCurrentProgressId(progressId);
      console.log('Progress record created with ID:', progressId);

      // IMMEDIATELY FETCH THE NEW PROGRESS RECORD to display it
      const { data: newProgress, error: fetchError } = await supabase
        .from('ai_generation_progress')
        .select('*')
        .eq('id', progressId)
        .single();
      
      if (newProgress && !fetchError) {
        setGenerationProgress(newProgress);
        console.log('Immediately set progress data:', newProgress);
      }

      const tokenResult = await deductTokens('full_course', `full_course_${proposalId}`);
      
      // Call the function with progress_id
      console.log('Calling generate-course function with progress_id:', progressId);
      const { data, error } = await supabase.functions.invoke('generate-course', {
        body: {
          creator_id: user.id,
          action: 'generate_full_course',
          proposal_id: proposalId,
          progress_id: progressId
        }
      });

      if (error) {
        console.error('Function call error:', error);
        // Update progress to error state if function call fails immediately
        await supabase
          .from('ai_generation_progress')
          .update({
            progress_percentage: 0,
            current_step: 'Failed - Function call error',
            agent_activity: {
              manager: { status: 'error', message: 'Function call failed: ' + error.message },
              structure: { status: 'error', message: 'Failed' },
              content: { status: 'error', message: 'Failed' },
              quiz: { status: 'error', message: 'Failed' },
              transcript: { status: 'error', message: 'Failed' },
              exam: { status: 'error', message: 'Failed' },
              image: { status: 'error', message: 'Failed' }
            }
          })
          .eq('id', progressId);
        
        throw new Error(error.message || 'Failed to create course');
      }

      if (data?.success) {
        console.log('✅ Course creation initiated successfully');
        toast.success('Course generation started! Tracking progress...');
        // The real-time subscription will handle completion and navigation
      } else {
        throw new Error(data?.error || 'Failed to create course');
      }
    } catch (error: any) {
      console.error('Error creating course:', error);
      
      if (error.message?.includes('Insufficient tokens')) {
        toast.error('Insufficient tokens to create full course');
        await refetchTokens();
        setStep('proposal');
      } else if (error.message?.includes('Stored proposal not found')) {
        toast.error('The course proposal expired. Please generate a new proposal.');
        setStep('input');
      } else if (error.message?.includes('timeout')) {
        toast.error('Course generation is taking longer than expected. Please try again.');
        setStep('proposal');
      } else {
        toast.error(error.message || 'Failed to create course. Please try again.');
        setStep('proposal');
      }
      
      // Reset progress on error
      setGenerationProgress(null);
      setCurrentProgressId(null);
    } finally {
      setProgressLoading(false);
      setLoading(false);
    }
  };

  const handleGenerateProposal = () => {
    checkTokensAndProceed('proposal', generateProposal);
  };

  const handleCreateFullCourse = () => {
    checkTokensAndProceed('full_course', createFullCourse);
  };

  const checkProposalExpiry = (expiresAt: string) => {
    return new Date(expiresAt) > new Date();
  };

  const features = [
    {
      icon: <Zap className="h-5 w-5" />,
      title: "AI Manager Agent",
      description: "Intelligent coordination of specialized AI agents"
    },
    {
      icon: <BookOpen className="h-5 w-5" />,
      title: "Complete Content",
      description: "Includes video scripts, 3 quizzes per module, and 15 exam questions"
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: "Real-time Progress",
      description: "Live updates from database with detailed tracking"
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Engaging Content",
      description: "Optimized for student engagement and retention"
    }
  ];

  // Gradient utilities
  const gradientClass = "bg-gradient-to-r from-orange-500 to-purple-600";
  const gradientTextClass = "bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent";
  const gradientHoverClass = "hover:from-orange-600 hover:to-purple-700";
  const greenGradientClass = "bg-gradient-to-r from-green-500 to-emerald-600";

  const getProgressStepColor = (percentage: number) => {
    if (percentage < 30) return "from-orange-500 to-amber-500";
    if (percentage < 70) return "from-purple-500 to-indigo-500";
    return "from-green-500 to-emerald-500";
  };

  const getAgentStatusColor = (status: string) => {
    switch (status) {
      case 'active': return "bg-green-500 animate-pulse";
      case 'completed': return "bg-green-500";
      case 'processing': return "bg-orange-500 animate-pulse";
      case 'error': return "bg-red-500";
      default: return "bg-gray-300";
    }
  };

  const getAgentStatusDisplay = (status: string) => {
    switch (status) {
      case 'active': return { class: 'bg-orange-100 text-orange-800', text: 'Active' };
      case 'completed': return { class: 'bg-green-100 text-green-800', text: 'Completed' };
      case 'processing': return { class: 'bg-purple-100 text-purple-800', text: 'Processing' };
      case 'error': return { class: 'bg-red-100 text-red-800', text: 'Error' };
      default: return { class: 'bg-gray-100 text-gray-800', text: 'Pending' };
    }
  };

  const availableTokens = getAvailableTokens();

  return (
    <CreatorLayout title="Create Course with AI">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Free Trial Banner */}
        <FreeTrialBanner />

        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center items-center space-x-3">
            <div className={`rounded-full ${gradientClass} p-3 shadow-lg`}>
              <Bot className="h-8 w-8 text-white" />
            </div>
            <Sparkles className="h-8 w-8 text-orange-500" />
          </div>
          <h1 className={`text-4xl font-bold ${gradientTextClass}`}>
            AI Course Creator
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Let our AI Manager Agent create a complete, production-ready course for you
          </p>
        </div>

        {/* Starting Progress Display - Shows immediately when creating */}
        {(step === 'creating' && !generationProgress) && (
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm border-l-4 border-l-orange-500">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-xl">
                <BarChart3 className="h-5 w-5 mr-2 text-orange-500" />
                Starting Course Creation...
                {currentProgressId && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    ID: {currentProgressId.slice(0, 8)}...
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Initializing AI agents and setting up your course structure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Progress</span>
                  <span>0%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-amber-500 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `0%` }}
                  ></div>
                </div>
              </div>

              {/* Current Step */}
              <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg border border-orange-200">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Bot className="h-5 w-5 text-orange-500" />
                  <h4 className="font-semibold text-gray-800">Current Step</h4>
                </div>
                <p className="text-lg font-medium text-gray-900">Initializing AI Manager Agent...</p>
                <p className="text-sm text-gray-600 mt-1">
                  Setting up course creation pipeline
                </p>
              </div>

              {/* Loading Animation */}
              <div className="text-center pt-4">
                <div className="flex justify-center space-x-2 mb-4">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <p className="text-sm text-gray-500">
                  This usually takes 2-3 minutes. Progress will update automatically.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Progress Display */}
        {generationProgress && (
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm border-l-4 border-l-orange-500">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-xl">
                <BarChart3 className="h-5 w-5 mr-2 text-orange-500" />
                Active Course Generation
                {currentProgressId && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    ID: {currentProgressId.slice(0, 8)}...
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Real-time progress from our AI agents - Updates automatically
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Progress</span>
                  <span>{generationProgress.progress_percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`bg-gradient-to-r h-3 rounded-full transition-all duration-500 ease-out ${getProgressStepColor(generationProgress.progress_percentage)}`}
                    style={{ width: `${generationProgress.progress_percentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Current Step */}
              <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg border border-orange-200">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Bot className="h-5 w-5 text-orange-500" />
                  <h4 className="font-semibold text-gray-800">Current Step</h4>
                </div>
                <p className="text-lg font-medium text-gray-900">{generationProgress.current_step}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Last updated: {new Date(generationProgress.updated_at).toLocaleTimeString()}
                </p>
              </div>

              {/* Agent Activity from Database */}
              {generationProgress.agent_activity && (
                <div className="space-y-3">
                  <h5 className="font-semibold text-gray-800 flex items-center">
                    <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
                    AI Agent Activity
                  </h5>
                  <div className="space-y-2 text-sm">
                    {Object.entries(generationProgress.agent_activity).map(([agent, data]: [string, any]) => {
                      const statusInfo = getAgentStatusDisplay(data.status);
                      return (
                        <div key={agent} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${getAgentStatusColor(data.status)}`}></div>
                            <span className="capitalize font-medium">{agent} Agent</span>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs px-2 py-1 rounded-full ${statusInfo.class}`}>
                              {statusInfo.text}
                            </span>
                            <p className="text-xs text-gray-500 mt-1 max-w-xs">{data.message}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="text-center pt-4">
                <p className="text-sm text-gray-500">
                  This usually takes 2-3 minutes. Progress is saved automatically and updates in real-time.
                </p>
                {generationProgress.progress_percentage === 100 && (
                  <Button 
                    onClick={() => navigate('/creator/courses')}
                    className="mt-2 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    View Your Courses
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Token Balance */}
        <Card className="bg-gradient-to-r from-orange-50 to-purple-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Your Token Balance</h3>
                <p className="text-sm text-gray-600">Tokens available for AI features</p>
              </div>
              <div className="text-right space-y-2">
                {availableTokens.free > 0 && !tokenBalance?.has_used_free_trial && (
                  <div className="flex items-center justify-end space-x-2">
                    <Gift className="h-4 w-4 text-green-500" />
                    <span className="font-semibold text-green-600">
                      {availableTokens.free} free tokens
                    </span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Trial
                    </Badge>
                  </div>
                )}
                
                <div className="flex items-center justify-end space-x-2">
                  <Coins className="h-5 w-5 text-orange-600" />
                  <span className="text-xl font-bold text-orange-600">
                    {availableTokens.paid}
                  </span>
                </div>
                <p className="text-sm text-gray-500">paid tokens available</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <div className="flex justify-between">
                  <span>Course Proposal:</span>
                  <span className="font-semibold">8 tokens</span>
                </div>
                <div className="flex justify-between">
                  <span>Full Course:</span>
                  <span className="font-semibold">25 tokens</span>
                </div>
              </div>
              <div className="text-right">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/creator/tokens')}
                  className="text-orange-600 border-orange-300 hover:bg-orange-50"
                >
                  <Coins className="h-4 w-4 mr-1" />
                  Top Up Tokens
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

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

        {/* Step 1: Course Input */}
        {step === 'input' && !generationProgress && (
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className={`text-2xl font-bold ${gradientTextClass}`}>
                Describe Your Course
              </CardTitle>
              <CardDescription className="text-lg">
                Provide some details about the course you want to create
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-base font-semibold">Course Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Advanced React Patterns"
                    value={courseData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="h-12 border-2 focus:border-orange-300 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficulty" className="text-base font-semibold">Difficulty Level</Label>
                  <select
                    id="difficulty"
                    className="w-full px-3 py-3 border-2 border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                    value={courseData.difficulty}
                    onChange={(e) => handleInputChange('difficulty', e.target.value)}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-semibold">Course Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what students will learn in this course..."
                  rows={4}
                  value={courseData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="border-2 focus:border-orange-300 resize-none transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAudience" className="text-base font-semibold">Target Audience</Label>
                <Input
                  id="targetAudience"
                  placeholder="e.g., Web developers with basic JavaScript knowledge"
                  value={courseData.targetAudience}
                  onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                  className="border-2 focus:border-orange-300 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="learningGoals" className="text-base font-semibold">Key Learning Goals</Label>
                <Textarea
                  id="learningGoals"
                  placeholder="What specific skills will students gain?"
                  rows={3}
                  value={courseData.learningGoals}
                  onChange={(e) => handleInputChange('learningGoals', e.target.value)}
                  className="border-2 focus:border-orange-300 resize-none transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration" className="text-base font-semibold">Estimated Duration</Label>
                <Input
                  id="duration"
                  placeholder="e.g., 8 hours, 6 weeks"
                  value={courseData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  className="border-2 focus:border-orange-300 transition-colors"
                />
              </div>

              <Button
                onClick={handleGenerateProposal}
                disabled={loading || !courseData.title.trim() || !courseData.description.trim()}
                className={`w-full ${gradientClass} text-white font-semibold py-3 rounded-lg ${gradientHoverClass} transition-all duration-200 shadow-lg hover:shadow-xl`}
              >
                <Bot className="h-5 w-5 mr-2" />
                {loading ? 'Generating Proposal...' : 'Generate Course Proposal (8 tokens)'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Generating */}
        {step === 'generating' && (
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm text-center">
            <CardContent className="pt-12 pb-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-6"></div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Generating Your Course Proposal</h3>
              <p className="text-gray-600 mb-4">Our AI is crafting a comprehensive course structure...</p>
              <div className="flex justify-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Proposal Review */}
        {step === 'proposal' && proposal && !generationProgress && (
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className={`text-2xl font-bold ${gradientTextClass}`}>
                Course Proposal Generated!
              </CardTitle>
              <CardDescription className="text-lg">
                Review the course structure and create your course
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Course Overview */}
              <div className="bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg p-6 border border-orange-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`rounded-lg ${gradientClass} p-2 text-white`}>
                      <Play className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{proposal.course_title}</h3>
                      <p className="text-gray-700 mt-1">{proposal.course_summary}</p>
                    </div>
                  </div>
                  <Badge className={`${gradientClass} text-white border-0`}>
                    {proposal.difficulty_level}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center p-3 bg-white rounded-lg border border-orange-100">
                    <Clock className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                    <p className="font-semibold text-gray-900">{Math.ceil(proposal.duration_minutes / 60)}h</p>
                    <p className="text-xs text-gray-600">Duration</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-orange-100">
                    <BookOpen className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                    <p className="font-semibold text-gray-900">{proposal.module_outline?.length || 0}</p>
                    <p className="text-xs text-gray-600">Modules</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-orange-100">
                    <FileText className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                    <p className="font-semibold text-gray-900">
                      {proposal.module_outline?.reduce((acc: number, mod: any) => acc + (mod.lessons?.length || 0), 0) || 0}
                    </p>
                    <p className="text-xs text-gray-600">Lessons</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-orange-100">
                    <Target className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                    <p className="font-semibold text-gray-900">
                      {proposal.is_free ? 'Free' : `$${proposal.price}`}
                    </p>
                    <p className="text-xs text-gray-600">Price</p>
                  </div>
                </div>
              </div>

              {/* Learning Outcomes */}
              {proposal.learning_outcomes && proposal.learning_outcomes.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-semibold text-lg mb-3 flex items-center">
                    <GraduationCap className="h-5 w-5 mr-2 text-orange-500" />
                    What You'll Learn
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {proposal.learning_outcomes.slice(0, 6).map((outcome: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{outcome}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modules Preview */}
              {proposal.module_outline && proposal.module_outline.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg flex items-center">
                    <BookOpen className="h-5 w-5 mr-2 text-purple-500" />
                    Course Modules
                  </h4>
                  {proposal.module_outline.map((module: any, index: number) => (
                    <Card key={index} className="border border-orange-100 hover:border-orange-300 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <div className={`w-6 h-6 rounded-full ${gradientClass} flex items-center justify-center text-white text-xs font-bold`}>
                                {module.module_number || index + 1}
                              </div>
                              <h5 className="font-semibold text-gray-900">{module.module_title}</h5>
                            </div>
                            <p className="text-sm text-gray-600">{module.module_description}</p>
                          </div>
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            {module.lessons?.length || 0} lessons
                          </Badge>
                        </div>
                        {module.lessons && module.lessons.length > 0 && (
                          <div className="mt-3 grid grid-cols-1 gap-2">
                            {module.lessons.slice(0, 4).map((lesson: any, lessonIndex: number) => (
                              <div key={lessonIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <Play className="h-3 w-3 text-orange-500" />
                                  <span className="text-sm font-medium text-gray-700">{lesson.lesson_title}</span>
                                </div>
                                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                                  {lesson.duration_minutes}min
                                </span>
                              </div>
                            ))}
                            {module.lessons.length > 4 && (
                              <div className="text-sm text-gray-500 text-center py-1">
                                +{module.lessons.length - 4} more lessons
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
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
                    <span>3 quizzes per module</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>15 final exam questions</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Automatic retry on failures</span>
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
                  onClick={handleCreateFullCourse}
                  disabled={loading || progressLoading}
                  className={`flex-1 ${gradientClass} text-white font-semibold py-3 rounded-lg ${gradientHoverClass} transition-all duration-200 shadow-lg hover:shadow-xl`}
                >
                  {(loading || progressLoading) ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Course...
                    </>
                  ) : (
                    <>
                      <Bot className="h-4 w-4 mr-2" />
                      Create with AI Agents (25 tokens)
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Past Proposals Section */}
        {pastProposals.length > 0 && (
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <History className="h-5 w-5 mr-2 text-purple-500" />
                Your Past AI Course Proposals
              </CardTitle>
              <CardDescription>
                Previously generated course proposals and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pastProposals.map((proposalItem) => {
                  const proposalData = proposalItem.proposal_data;
                  const isExpired = !checkProposalExpiry(proposalItem.expires_at);
                  const progress = proposalItem.ai_generation_progress?.[0];
                  
                  return (
                    <div key={proposalItem.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-orange-300 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-full ${isExpired ? 'bg-gray-400' : gradientClass} flex items-center justify-center text-white`}>
                          <BookOpen className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{proposalData.course_title}</h4>
                          <p className="text-sm text-gray-600 line-clamp-1">{proposalData.course_summary}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                              {proposalData.difficulty_level}
                            </Badge>
                            <div className="flex items-center text-xs text-gray-500">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(proposalItem.created_at).toLocaleDateString()}
                            </div>
                            {isExpired && (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Expired
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {progress?.progress_percentage === 100 ? (
                          <Badge className={greenGradientClass + " text-white border-0"}>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        ) : progress?.progress_percentage > 0 ? (
                          <div className="text-right">
                            <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                              In Progress
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              {progress.progress_percentage}% complete
                            </p>
                          </div>
                        ) : isExpired ? (
                          <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">
                            Expired
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            Proposal Ready
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Token Usage Dialog */}
        <TokenUsageDialog
          open={showTokenDialog}
          onOpenChange={setShowTokenDialog}
          featureType={requiredTokens === 8 ? 'course_proposal' : 'full_course'}
          requiredTokens={requiredTokens}
          featureName={featureName}
          onContinue={pendingAction || (() => {})}
        />
      </div>
    </CreatorLayout>
  );
};

export default CreatorCourseCreateWithAI;
