import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bot, Sparkles, BookOpen, Clock, Users, Zap, CheckCircle, ArrowRight, Play, Star, FileText, Target, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import CreatorLayout from '@/components/creator/CreatorLayout';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const CreatorCourseCreateWithAI = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  const handleInputChange = (field: string, value: string) => {
    setCourseData(prev => ({
      ...prev,
      [field]: value
    }));
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
        setProposalId(data.proposal_id); // Store the proposal ID for full course creation
        setStep('proposal');
        toast.success('Course proposal generated successfully!');
      } else {
        throw new Error(data.error || 'Failed to generate proposal');
      }
    } catch (error: any) {
      console.error('Error generating proposal:', error);
      toast.error(error.message || 'Failed to generate course proposal');
      setStep('input');
    } finally {
      setLoading(false);
    }
  };

  const createFullCourse = async () => {
    if (!proposal) return;

    setLoading(true);
    setStep('creating');

    try {
      const { data, error } = await supabase.functions.invoke('generate-course', {
        body: {
          creator_id: user?.id,
          action: 'generate_full_course',
          proposal_id: proposalId // Use the stored proposal ID
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Course created successfully!');
        navigate(`/creator/courses/${data.course_id}/content`);
      } else {
        throw new Error(data.error || 'Failed to create course');
      }
    } catch (error: any) {
      console.error('Error creating course:', error);
      
      if (error.message?.includes('Stored proposal not found')) {
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

  const features = [
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Instant Course Structure",
      description: "AI generates comprehensive modules and lessons"
    },
    {
      icon: <BookOpen className="h-5 w-5" />,
      title: "Complete Content",
      description: "Includes video scripts, quizzes, and learning materials"
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: "Save Time",
      description: "Create production-ready courses in minutes"
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

  return (
    <CreatorLayout title="Create Course with AI">
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
            AI Course Creator
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Let our AI assistant create a complete, production-ready course for you in minutes
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
                onClick={generateProposal}
                disabled={loading || !courseData.title.trim() || !courseData.description.trim()}
                className={`w-full ${gradientClass} text-white font-semibold py-3 rounded-lg ${gradientHoverClass} transition-all duration-200 shadow-lg hover:shadow-xl`}
              >
                <Bot className="h-5 w-5 mr-2" />
                {loading ? 'Generating Proposal...' : 'Generate Course Proposal'}
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
                  onClick={createFullCourse}
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
                      Create Full Course
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
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm text-center">
            <CardContent className="pt-12 pb-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-6"></div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Creating Your Course</h3>
              <p className="text-gray-600 mb-6">
                This may take a few minutes. We're generating:
              </p>
              <div className="space-y-3 text-sm text-gray-600 max-w-md mx-auto">
                <div className="flex items-center justify-center p-3 bg-orange-50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-3" />
                  <span>Course structure and metadata</span>
                </div>
                <div className="flex items-center justify-center p-3 bg-orange-50 rounded-lg">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mr-3"></div>
                  <span>Lesson content and video transcripts</span>
                </div>
                <div className="flex items-center justify-center p-3 bg-orange-50 rounded-lg">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mr-3"></div>
                  <span>Quizzes and assessments</span>
                </div>
                <div className="flex items-center justify-center p-3 bg-orange-50 rounded-lg">
                  <Star className="h-4 w-4 text-purple-500 mr-3" />
                  <span>Final exam preparation</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-6">
                Please don't close this window while we create your amazing course!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </CreatorLayout>
  );
};

export default CreatorCourseCreateWithAI;
