import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Bot, Sparkles, BookOpen, Clock, Users, Zap, CheckCircle, ArrowRight, Play, Star, FileText, Target, GraduationCap, Coins, Gift, History, ChevronRight, RefreshCw, AlertTriangle, Calendar, Send, Brain, Lightbulb, Rocket } from 'lucide-react';
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
  const [step, setStep] = useState<'input' | 'generating' | 'proposal' | 'creating'>('input');
  const [prompt, setPrompt] = useState('');
  const [proposal, setProposal] = useState<any>(null);
  const [proposalId, setProposalId] = useState<string | null>(null);
  
  const [pastProposals, setPastProposals] = useState<any[]>([]);
  const [functionError, setFunctionError] = useState<string | null>(null);
  const [typingIndex, setTypingIndex] = useState(0);
  
  // Token usage states
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [requiredTokens, setRequiredTokens] = useState(0);
  const [featureName, setFeatureName] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Example prompts for typing animation
  const examplePrompts = [
    "Create a comprehensive course about modern web development with React, TypeScript, and Next.js for intermediate developers...",
    "Build a complete Python data science course covering pandas, numpy, and machine learning for beginners...",
    "Design an advanced digital marketing strategy course with social media, SEO, and analytics for business owners...",
    "Develop a mobile app development course using Flutter and Dart for creating cross-platform applications..."
  ];

  // Typing animation effect
  useEffect(() => {
    if (step === 'input' && !prompt) {
      const interval = setInterval(() => {
        setTypingIndex((prev) => (prev + 1) % examplePrompts.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [step, prompt]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [prompt]);

  // Fetch past proposals
  useEffect(() => {
    if (!user?.id) return;

    const fetchPastProposals = async () => {
      const { data, error } = await supabase
        .from('ai_course_proposals')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setPastProposals(data);
      }
    };

    fetchPastProposals();
  }, [user?.id]);

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
    if (!prompt.trim()) {
      toast.error('Please describe the course you want to create');
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
      const tokenResult = await deductTokens('course_proposal', `course_proposal_${Date.now()}`);
      
      console.log('Calling generate-course function for proposal...');
      const { data, error } = await supabase.functions.invoke('generate-course', {
        body: {
          user_prompt: prompt,
          creator_id: user.id,
          action: 'generate_proposal'
        }
      });

      if (error) {
        console.error('Function call error:', error);
        throw new Error(error.message || 'Failed to generate proposal');
      }

      if (data?.success) {
        const { data: proposalData, error: proposalError } = await supabase
          .from('ai_course_proposals')
          .insert({
            creator_id: user.id,
            proposal_data: data.proposal,
            user_prompt: prompt
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
      
      let errorMessage = error.message || 'Failed to generate course proposal';
      
      if (error.message?.includes('Insufficient tokens')) {
        errorMessage = 'Insufficient tokens to generate course proposal';
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

  const createFullCourse = async () => {
    if (!proposal || !proposalId) {
      toast.error('No proposal found to create course from');
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
      const tokenResult = await deductTokens('full_course', `full_course_${proposalId}`);
      
      console.log('Calling generate-course function for full course...');
      const { data, error } = await supabase.functions.invoke('generate-course', {
        body: {
          creator_id: user.id,
          action: 'generate_full_course',
          proposal_id: proposalId,
          use_gpt4: true
        }
      });

      if (error) {
        console.error('Function call error:', error);
        throw new Error(error.message || 'Failed to create course');
      }

      if (data?.success) {
        console.log('✅ Course creation completed successfully');
        toast.success('Course created successfully!');
        
        await refetchTokens();
        setTimeout(() => {
          navigate('/creator/courses');
        }, 2000);
      } else {
        throw new Error(data?.error || 'Failed to create course');
      }
    } catch (error: any) {
      console.error('Error creating course:', error);
      
      let errorMessage = error.message || 'Failed to create course. Please try again.';
      
      if (error.message?.includes('Insufficient tokens')) {
        errorMessage = 'Insufficient tokens to create full course';
        await refetchTokens();
        setStep('proposal');
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Course generation is taking longer than expected. Please try again.';
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

  const handleGenerateProposal = () => {
    checkTokensAndProceed('proposal', generateProposal);
  };

  const handleCreateFullCourse = () => {
    checkTokensAndProceed('full_course', createFullCourse);
  };

  const loadProposalIntoForm = (proposalData: any, userPrompt?: string) => {
    setPrompt(userPrompt || '');
    setStep('input');
    toast.success('Proposal loaded! You can modify your prompt and generate a new course.');
  };

  // Gradient utilities
  const gradientClass = "bg-gradient-to-r from-orange-500 to-purple-600";
  const gradientTextClass = "bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent";
  const gradientHoverClass = "hover:from-orange-600 hover:to-purple-700";
  const subtleGradient = "bg-gradient-to-br from-orange-50 via-white to-purple-50";

  const availableTokens = getAvailableTokens();

  return (
    <CreatorLayout title="Create Course with Lumo AI">
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
            Transform your ideas into complete, engaging courses with intelligent AI analysis
          </p>
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
                      <p className="text-sm text-gray-600">Create amazing courses with Lumo AI</p>
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
                      Tell Lumo AI what course you want to create. Be as detailed as you like!
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Prompt Input */}
                    <div className="relative">
                      <Textarea
                        ref={textareaRef}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder=""
                        className="min-h-[120px] p-4 text-lg border-2 border-gray-200 rounded-xl resize-none focus:border-orange-300 transition-all duration-300 bg-white/50 backdrop-blur-sm"
                        disabled={loading}
                      />
                      
                      {/* Typing Animation Placeholder */}
                      {!prompt && (
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
                        <span>Include target audience and skill level</span>
                      </div>
                      <div className="flex items-start space-x-2 p-3 bg-purple-50 rounded-lg">
                        <Target className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <span>Specify key topics and learning goals</span>
                      </div>
                      <div className="flex items-start space-x-2 p-3 bg-orange-50 rounded-lg">
                        <BookOpen className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        <span>Mention preferred course format</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button
                      onClick={handleGenerateProposal}
                      disabled={loading || !prompt.trim()}
                      className={`w-full ${gradientClass} text-white font-semibold py-4 rounded-xl ${gradientHoverClass} transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-[1.02] text-lg`}
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Analyzing Your Vision...
                        </>
                      ) : (
                        <>
                          <Brain className="h-5 w-5 mr-2" />
                          Generate Course Proposal (8 tokens)
                          <Rocket className="h-5 w-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Generating Proposal */}
        {step === 'generating' && !functionError && (
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm text-center">
            <CardContent className="py-16">
              <div className="relative mx-auto mb-8">
                {/* Orbital Animation */}
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
              
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Lumo AI is Analyzing Your Vision</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto text-lg">
                We're understanding your requirements and crafting the perfect course structure...
              </p>
              
              {/* Intelligent Analysis Indicators */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-md mx-auto text-sm text-gray-500">
                <div className="flex items-center justify-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Analyzing Topics</span>
                </div>
                <div className="flex items-center justify-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                  <span>Structuring Content</span>
                </div>
                <div className="flex items-center justify-center space-x-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <span>Designing Curriculum</span>
                </div>
                <div className="flex items-center justify-center space-x-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                  <span>Optimizing Flow</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Course Creation Loading */}
        {step === 'creating' && !functionError && (
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm text-center">
            <CardContent className="py-16">
              {/* Advanced Animation */}
              <div className="relative mx-auto mb-8">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-40 h-40 border-4 border-orange-200 rounded-full animate-spin"></div>
                  <div className="w-32 h-32 border-4 border-purple-200 rounded-full animate-spin" style={{ animationDirection: 'reverse' }}></div>
                </div>
                <div className="relative rounded-full bg-gradient-to-r from-orange-500 to-purple-600 w-24 h-24 flex items-center justify-center mx-auto shadow-2xl">
                  <Bot className="h-10 w-10 text-white animate-bounce" />
                </div>
              </div>
              
              <h3 className="text-3xl font-bold mb-4 text-gray-800">Creating Your Masterpiece</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto text-lg">
                Lumo AI is generating your complete course with intelligent content, quizzes, and materials...
              </p>
              
              {/* Progress Indicators */}
              <div className="max-w-md mx-auto space-y-4">
                {[
                  'Designing course structure',
                  'Creating engaging lessons',
                  'Developing assessments',
                  'Generating resources',
                  'Finalizing course materials'
                ].map((task, index) => (
                  <div key={task} className="flex items-center space-x-3 text-left">
                    <div className={`w-3 h-3 rounded-full ${index < 2 ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                    <span className={`flex-1 ${index < 2 ? 'text-gray-700' : 'text-gray-400'}`}>{task}</span>
                    {index < 2 && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Proposal Review */}
        {step === 'proposal' && proposal && !functionError && (
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className={`text-3xl font-bold ${gradientTextClass}`}>
                🎉 Course Blueprint Ready!
              </CardTitle>
              <CardDescription className="text-lg">
                Lumo AI has analyzed your vision and created this comprehensive course structure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Course Overview */}
              <div className="bg-gradient-to-r from-orange-50 to-purple-50 rounded-2xl p-6 border border-orange-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className={`rounded-xl ${gradientClass} p-3 text-white shadow-lg`}>
                      <Play className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{proposal.course_title}</h3>
                      <p className="text-gray-700 mt-2 text-lg leading-relaxed">{proposal.course_summary}</p>
                    </div>
                  </div>
                  <Badge className={`${gradientClass} text-white border-0 text-sm px-3 py-1`}>
                    {proposal.difficulty_level}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center p-4 bg-white rounded-xl border border-orange-100 shadow-sm">
                    <Clock className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                    <p className="font-bold text-gray-900 text-lg">{Math.ceil(proposal.duration_minutes / 60)}h</p>
                    <p className="text-xs text-gray-600">Total Duration</p>
                  </div>
                  <div className="text-center p-4 bg-white rounded-xl border border-orange-100 shadow-sm">
                    <BookOpen className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                    <p className="font-bold text-gray-900 text-lg">{proposal.module_outline?.length || 0}</p>
                    <p className="text-xs text-gray-600">Learning Modules</p>
                  </div>
                  <div className="text-center p-4 bg-white rounded-xl border border-orange-100 shadow-sm">
                    <FileText className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                    <p className="font-bold text-gray-900 text-lg">
                      {proposal.module_outline?.reduce((acc: number, mod: any) => acc + (mod.lessons?.length || 0), 0) || 0}
                    </p>
                    <p className="text-xs text-gray-600">Lessons</p>
                  </div>
                  <div className="text-center p-4 bg-white rounded-xl border border-orange-100 shadow-sm">
                    <Target className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                    <p className="font-bold text-gray-900 text-lg">
                      {proposal.is_free ? 'Free' : `$${proposal.price}`}
                    </p>
                    <p className="text-xs text-gray-600">Price Point</p>
                  </div>
                </div>
              </div>

              {/* Learning Outcomes */}
              {proposal.learning_outcomes && proposal.learning_outcomes.length > 0 && (
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h4 className="font-bold text-xl mb-4 flex items-center">
                    <GraduationCap className="h-6 w-6 mr-3 text-orange-500" />
                    What Students Will Master
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {proposal.learning_outcomes.slice(0, 6).map((outcome: string, index: number) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 font-medium">{outcome}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modules Preview */}
              {proposal.module_outline && proposal.module_outline.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-bold text-xl flex items-center">
                    <BookOpen className="h-6 w-6 mr-3 text-purple-500" />
                    Course Journey
                  </h4>
                  {proposal.module_outline.map((module: any, index: number) => (
                    <Card key={index} className="border border-orange-100 hover:border-orange-300 transition-all duration-300 shadow-sm hover:shadow-md">
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-start space-x-4">
                            <div className={`w-8 h-8 rounded-full ${gradientClass} flex items-center justify-center text-white text-sm font-bold shadow-md`}>
                              {module.module_number || index + 1}
                            </div>
                            <div>
                              <h5 className="font-bold text-lg text-gray-900">{module.module_title}</h5>
                              <p className="text-gray-600 mt-1">{module.module_description}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 font-semibold">
                            {module.lessons?.length || 0} lessons
                          </Badge>
                        </div>
                        {module.lessons && module.lessons.length > 0 && (
                          <div className="mt-4 grid grid-cols-1 gap-2">
                            {module.lessons.slice(0, 4).map((lesson: any, lessonIndex: number) => (
                              <div key={lessonIndex} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-white transition-colors">
                                <div className="flex items-center space-x-3">
                                  <Play className="h-4 w-4 text-orange-500" />
                                  <span className="font-medium text-gray-700">{lesson.lesson_title}</span>
                                </div>
                                <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded border">
                                  {lesson.duration_minutes}min
                                </span>
                              </div>
                            ))}
                            {module.lessons.length > 4 && (
                              <div className="text-center py-2 text-gray-500 font-medium">
                                +{module.lessons.length - 4} more lessons in this module
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
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
                  onClick={handleCreateFullCourse}
                  disabled={loading}
                  className={`flex-1 ${gradientClass} text-white font-bold py-3 rounded-xl ${gradientHoverClass} transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-[1.02] text-lg`}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating Your Course...
                    </>
                  ) : (
                    <>
                      <Bot className="h-5 w-5 mr-2" />
                      Create Complete Course (25 tokens)
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Past Proposals */}
        {pastProposals.length > 0 && step === 'input' && (
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center text-2xl font-bold">
                    <History className="h-6 w-6 mr-3 text-purple-500" />
                    Your AI Course History
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Revisit and modify your previous course proposals
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
                      onClick={() => loadProposalIntoForm(proposalData, proposalItem.user_prompt)}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-xl ${gradientClass} flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                          <BookOpen className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 group-hover:text-orange-700 transition-colors text-lg">
                            {proposalData.course_title}
                          </h4>
                          <p className="text-gray-600 line-clamp-1 mt-1">{proposalData.course_summary}</p>
                          <div className="flex items-center space-x-3 mt-2">
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                              {proposalData.difficulty_level}
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

export default CreatorCourseCreateWithAI;
