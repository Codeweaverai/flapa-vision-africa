import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bot, Sparkles, BookOpen, Clock, Users, Zap, CheckCircle, ArrowRight } from 'lucide-react';
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

      // Call the Supabase Edge Function
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
          proposal_data: proposal
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
      toast.error(error.message || 'Failed to create course');
      setStep('proposal');
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

  return (
    <CreatorLayout title="Create Course with AI">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center items-center space-x-3">
            <div className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 p-3">
              <Bot className="h-8 w-8 text-white" />
            </div>
            <Sparkles className="h-8 w-8 text-yellow-500" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Course Creator
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Let our AI assistant create a complete, production-ready course for you in minutes
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="text-center border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-purple-600 flex items-center justify-center text-white mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Step 1: Course Input */}
        {step === 'input' && (
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                Describe Your Course
              </CardTitle>
              <CardDescription>
                Provide some details about the course you want to create
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Advanced React Patterns"
                    value={courseData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <select
                    id="difficulty"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                <Label htmlFor="description">Course Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what students will learn in this course..."
                  rows={4}
                  value={courseData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Input
                  id="targetAudience"
                  placeholder="e.g., Web developers with basic JavaScript knowledge"
                  value={courseData.targetAudience}
                  onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="learningGoals">Key Learning Goals</Label>
                <Textarea
                  id="learningGoals"
                  placeholder="What specific skills will students gain?"
                  rows={3}
                  value={courseData.learningGoals}
                  onChange={(e) => handleInputChange('learningGoals', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Estimated Duration</Label>
                <Input
                  id="duration"
                  placeholder="e.g., 8 hours, 6 weeks"
                  value={courseData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                />
              </div>

              <Button
                onClick={generateProposal}
                disabled={loading || !courseData.title.trim() || !courseData.description.trim()}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Bot className="h-5 w-5 mr-2" />
                Generate Course Proposal
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Generating */}
        {step === 'generating' && (
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm text-center">
            <CardContent className="pt-12 pb-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-6"></div>
              <h3 className="text-xl font-semibold mb-2">Generating Your Course Proposal</h3>
              <p className="text-gray-600 mb-4">Our AI is crafting a comprehensive course structure...</p>
              <div className="flex justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Proposal Review */}
        {step === 'proposal' && proposal && (
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl bg-gradient-to-r from-green-600 to-purple-600 bg-clip-text text-transparent">
                Course Proposal Generated!
              </CardTitle>
              <CardDescription>
                Review the course structure and create your course
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Course Overview */}
              <div className="bg-gradient-to-r from-green-50 to-purple-50 rounded-lg p-6 border border-green-200">
                <h3 className="text-xl font-semibold mb-2">{proposal.course_title}</h3>
                <p className="text-gray-700 mb-4">{proposal.course_summary}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <Badge variant="secondary" className="mb-1">Level</Badge>
                    <p className="font-medium">{proposal.difficulty_level}</p>
                  </div>
                  <div className="text-center">
                    <Badge variant="secondary" className="mb-1">Duration</Badge>
                    <p className="font-medium">{Math.ceil(proposal.duration_minutes / 60)}h</p>
                  </div>
                  <div className="text-center">
                    <Badge variant="secondary" className="mb-1">Modules</Badge>
                    <p className="font-medium">{proposal.module_outline.length}</p>
                  </div>
                  <div className="text-center">
                    <Badge variant="secondary" className="mb-1">Price</Badge>
                    <p className="font-medium">{proposal.is_free ? 'Free' : `$${proposal.price}`}</p>
                  </div>
                </div>
              </div>

              {/* Modules Preview */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Course Modules</h4>
                {proposal.module_outline.map((module: any, index: number) => (
                  <Card key={index} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-semibold">Module {module.module_number}: {module.module_title}</h5>
                          <p className="text-sm text-gray-600 mt-1">{module.module_description}</p>
                        </div>
                        <Badge variant="outline">{module.lessons.length} lessons</Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-2">
                        {module.lessons.slice(0, 3).map((lesson: any, lessonIndex: number) => (
                          <div key={lessonIndex} className="flex items-center space-x-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>{lesson.lesson_title}</span>
                            <span className="text-gray-500 text-xs">({lesson.duration_minutes}min)</span>
                          </div>
                        ))}
                        {module.lessons.length > 3 && (
                          <div className="text-sm text-gray-500">
                            +{module.lessons.length - 3} more lessons
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  onClick={() => {
                    setStep('input');
                    setProposal(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Start Over
                </Button>
                <Button
                  onClick={createFullCourse}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-500 to-purple-600 text-white font-semibold py-3 rounded-lg hover:from-green-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
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
      </div>
    </CreatorLayout>
  );
};

export default CreatorCourseCreateWithAI;
