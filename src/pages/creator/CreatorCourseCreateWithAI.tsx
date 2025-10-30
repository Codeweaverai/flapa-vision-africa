// pages/creator/CreatorCourseCreateWithAI.tsx (Updated)
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bot, Sparkles, BookOpen, Clock, Users, Zap, CheckCircle, ArrowRight, Play, Star, FileText, Target, GraduationCap, Coins, Gift } from 'lucide-react';
import { toast } from 'sonner';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useTokens } from '@/hooks/useTokens';
import TokenUsageDialog from '@/components/creator/TokenUsageDialog';
import FreeTrialBanner from '@/components/creator/FreeTrialBanner';

const CreatorCourseCreateWithAI = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tokenBalance, hasEnoughTokens, deductTokens, getFeatureCost, getAvailableTokens } = useTokens();
  
  const [loading, setLoading] = useState(false);
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
  const [creationProgress, setCreationProgress] = useState({
    percentage: 0,
    step: 'Initializing...'
  });
  
  // Token usage states
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<() => void>(() => {});
  const [requiredTokens, setRequiredTokens] = useState(0);
  const [featureName, setFeatureName] = useState('');

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
        // User has enough tokens, proceed directly
        callback();
      } else {
        // Show token dialog
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

      // Deduct tokens before making the API call
      const tokenResult = await deductTokens('course_proposal', `course_proposal_${Date.now()}`);
      
      const { data, error } = await supabase.functions.invoke('generate-course', {
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
        toast.success(`Course proposal generated successfully! ${tokenResult.wasFree ? '(Used free tokens)' : ''}`);
      } else {
        throw new Error(data.error || 'Failed to generate proposal');
      }
    } catch (error: any) {
      console.error('Error generating proposal:', error);
      
      if (error.message.includes('Insufficient tokens')) {
        toast.error('Insufficient tokens to generate course proposal');
        setStep('input');
      } else {
        toast.error(error.message || 'Failed to generate course proposal');
        setStep('input');
      }
    } finally {
      setLoading(false);
    }
  };

  const createFullCourse = async () => {
    if (!proposal) return;

    setLoading(true);
    setStep('creating');
    
    // Reset progress
    setCreationProgress({
      percentage: 0,
      step: 'Initializing Manager Agent...'
    });

    try {
      // Deduct tokens before making the API call
      const tokenResult = await deductTokens('full_course', `full_course_${proposalId}`);
      
      const { data, error } = await supabase.functions.invoke('generate-course', {
        body: {
          creator_id: user?.id,
          action: 'generate_full_course',
          proposal_id: proposalId
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(`Course created successfully with AI Agents! ${tokenResult.wasFree ? '(Used free tokens)' : ''}`);
        navigate(`/creator/courses/${data.course_id}/content`);
      } else {
        throw new Error(data.error || 'Failed to create course');
      }
    } catch (error: any) {
      console.error('Error creating course:', error);
      
      if (error.message.includes('Insufficient tokens')) {
        toast.error('Insufficient tokens to create full course');
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
      title: "Optimized Process",
      description: "Faster generation with improved reliability"
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Engaging Content",
      description: "Optimized for student engagement and retention"
    }
  ];

  // Orange-purple gradient utility
  const gradientClass = "bg-gradient-to-r from-orange-500 to-purple-600";
  const gradientTextClass = "bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent";
  const gradientHoverClass = "hover:from-orange-600 hover:to-purple-700";

  // Progress steps for course creation
  const progressSteps = [
    { percentage: 10, step: 'Structure Generation', description: 'Creating course modules and lessons' },
    { percentage: 30, step: 'Content Generation', description: 'Generating detailed lesson content' },
    { percentage: 50, step: 'Quiz Creation', description: 'Creating 3 quizzes per module' },
    { percentage: 70, step: 'Transcript Generation', description: 'Creating video transcripts' },
    { percentage: 85, step: 'Final Exam', description: 'Creating 15 exam questions' },
    { percentage: 95, step: 'Final Assembly', description: 'Combining all components' },
    { percentage: 98, step: 'Database Save', description: 'Saving to database' },
    { percentage: 100, step: 'Completed', description: 'Course ready!' }
  ];

  const getCurrentProgressStep = () => {
    return progressSteps.find(step => step.percentage <= creationProgress.percentage) || progressSteps[0];
  };

  const availableTokens = getAvailableTokens();

  return (
    <CreatorLayout title="Create Course with AI">
      <div className="max-w-4xl mx-auto space-y-8">
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

        {/* Token Balance Display */}
        <Card className="bg-gradient-to-r from-orange-50 to-purple-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Your Token Balance</h3>
                <p className="text-sm text-gray-600">Tokens available for AI features</p>
              </div>
              <div className="text-right space-y-2">
                {/* Free Tokens */}
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
                
                {/* Paid Tokens */}
                <div className="flex items-center justify-end space-x-2">
                  <Coins className="h-5 w-5 text-orange-600" />
                  <span className="text-xl font-bold text-orange-600">
                    {availableTokens.paid}
                  </span>
                </div>
                <p className="text-sm text-gray-500">paid tokens available</p>
              </div>
            </div>

            {/* Usage Information */}
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
        {step === 'input' && (
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
        {step === 'proposal' && proposal && (
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
                    <p className="font-semibold text-gray-900">{proposal.module_outline.length}</p>
                    <p className="text-xs text-gray-600">Modules</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-orange-100">
                    <FileText className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                    <p className="font-semibold text-gray-900">
                      {proposal.module_outline.reduce((acc: number, mod: any) => acc + mod.lessons.length, 0)}
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
                              {module.module_number}
                            </div>
                            <h5 className="font-semibold text-gray-900">{module.module_title}</h5>
                          </div>
                          <p className="text-sm text-gray-600">{module.module_description}</p>
                        </div>
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          {module.lessons.length} lessons
                        </Badge>
                      </div>
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
                    </CardContent>
                  </Card>
                ))}
              </div>

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
                  disabled={loading}
                  className={`flex-1 ${gradientClass} text-white font-semibold py-3 rounded-lg ${gradientHoverClass} transition-all duration-200 shadow-lg hover:shadow-xl`}
                >
                  {loading ? (
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

        {/* Step 4: Creating Course */}
        {step === 'creating' && (
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className={`text-2xl font-bold ${gradientTextClass}`}>
                Creating Your Course with AI Agents
              </CardTitle>
              <CardDescription className="text-lg">
                Our Manager Agent is coordinating specialized AI agents to build your course
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
                    <span className="text-xs text-gray-500">Completed</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                      <span>Content Agent</span>
                    </div>
                    <span className="text-xs text-gray-500">Completed</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span>Quiz Agent</span>
                    </div>
                    <span className="text-xs text-gray-500">Active</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      <span>Transcript Agent</span>
                    </div>
                    <span className="text-xs text-gray-500">Pending</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      <span>Exam Agent</span>
                    </div>
                    <span className="text-xs text-gray-500">Pending</span>
                  </div>
                </div>
              </div>

              <div className="text-center pt-4">
                <p className="text-sm text-gray-500">
                  This usually takes 2-3 minutes. Please don't close this window.
                </p>
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
          onContinue={pendingAction}
        />
      </div>
    </CreatorLayout>
  );
};

export default CreatorCourseCreateWithAI;
