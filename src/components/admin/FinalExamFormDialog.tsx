import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Trash2, GraduationCap, Sparkles, Loader2, CheckCircle, Clock, Target } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface FinalExam {
  id: string;
  title: string;
  description: string;
  time_limit_minutes: number;
  passing_score: number;
  is_published: boolean;
}

interface ExamQuestion {
  id?: string;
  question: string;
  difficulty_level: 'easy' | 'moderate' | 'application' | 'advanced';
  answers: ExamAnswer[];
}

interface ExamAnswer {
  id?: string;
  answer: string;
  is_correct: boolean;
}

interface FinalExamFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  onExamSaved: (exam: FinalExam) => void;
  editingExam?: FinalExam | null;
}

const FinalExamFormDialog: React.FC<FinalExamFormDialogProps> = ({
  open,
  onOpenChange,
  courseId,
  onExamSaved,
  editingExam
}) => {
  const [formData, setFormData] = useState({
    title: 'Final Exam',
    description: '',
    time_limit_minutes: 90,
    passing_score: 70,
    is_published: false
  });

  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingExam) {
      setFormData({
        title: editingExam.title,
        description: editingExam.description || '',
        time_limit_minutes: editingExam.time_limit_minutes,
        passing_score: editingExam.passing_score,
        is_published: editingExam.is_published
      });
      loadExamQuestions(editingExam.id);
    } else {
      resetForm();
    }
  }, [editingExam, open]);

  const resetForm = () => {
    setFormData({
      title: 'Final Exam',
      description: '',
      time_limit_minutes: 90,
      passing_score: 70,
      is_published: false
    });
    setQuestions([]);
  };

  const loadExamQuestions = async (examId: string) => {
    try {
      const { data: questionsData, error: questionsError } = await supabase
        .from('final_exam_questions')
        .select('*, final_exam_answers(*)')
        .eq('exam_id', examId)
        .order('order_index');

      if (questionsError) throw questionsError;

      const formattedQuestions = questionsData?.map(q => ({
        id: q.id,
        question: q.question,
        difficulty_level: q.difficulty_level as 'easy' | 'moderate' | 'application' | 'advanced',
        answers: q.final_exam_answers?.map((a: any) => ({
          id: a.id,
          answer: a.answer,
          is_correct: a.is_correct
        })) || []
      })) || [];

      setQuestions(formattedQuestions);
    } catch (error) {
      console.error('Error loading exam questions:', error);
      toast.error('Failed to load exam questions');
    }
  };

  const addQuestion = () => {
    const newQuestion: ExamQuestion = {
      question: '',
      difficulty_level: 'easy',
      answers: [
        { answer: '', is_correct: true },
        { answer: '', is_correct: false },
        { answer: '', is_correct: false },
        { answer: '', is_correct: false }
      ]
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, field: keyof ExamQuestion, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateAnswer = (questionIndex: number, answerIndex: number, field: keyof ExamAnswer, value: any) => {
    const updated = [...questions];
    updated[questionIndex].answers[answerIndex] = {
      ...updated[questionIndex].answers[answerIndex],
      [field]: value
    };

    // Ensure only one correct answer
    if (field === 'is_correct' && value === true) {
      updated[questionIndex].answers.forEach((answer, idx) => {
        if (idx !== answerIndex) {
          answer.is_correct = false;
        }
      });
    }

    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    const updated = questions.filter((_, i) => i !== index);
    setQuestions(updated);
  };

  const validateQuestions = () => {
    if (questions.length === 0) {
      toast.error('Please add at least one question');
      return false;
    }

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (!question.question.trim()) {
        toast.error(`Question ${i + 1} is required`);
        return false;
      }

      const hasCorrectAnswer = question.answers.some(a => a.is_correct);
      if (!hasCorrectAnswer) {
        toast.error(`Question ${i + 1} must have at least one correct answer`);
        return false;
      }

      const hasEmptyAnswer = question.answers.some(a => !a.answer.trim());
      if (hasEmptyAnswer) {
        toast.error(`All answers for Question ${i + 1} are required`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateQuestions()) return;

    setLoading(true);
    try {
      let examId = editingExam?.id;

      if (editingExam) {
        // Update existing exam
        const { error: examError } = await supabase
          .from('final_exams')
          .update(formData)
          .eq('id', editingExam.id);

        if (examError) throw examError;
      } else {
        // Create new exam
        const { data: examData, error: examError } = await supabase
          .from('final_exams')
          .insert([{ ...formData, course_id: courseId }])
          .select()
          .single();

        if (examError) throw examError;
        examId = examData.id;
      }

      // Delete existing questions if editing
      if (editingExam) {
        await supabase
          .from('final_exam_questions')
          .delete()
          .eq('exam_id', editingExam.id);
      }

      // Insert questions
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const { data: questionData, error: questionError } = await supabase
          .from('final_exam_questions')
          .insert([{
            exam_id: examId,
            question: question.question,
            difficulty_level: question.difficulty_level,
            order_index: i
          }])
          .select()
          .single();

        if (questionError) throw questionError;

        // Insert answers
        const answersToInsert = question.answers.map((answer, idx) => ({
          question_id: questionData.id,
          answer: answer.answer,
          is_correct: answer.is_correct,
          order_index: idx
        }));

        const { error: answersError } = await supabase
          .from('final_exam_answers')
          .insert(answersToInsert);

        if (answersError) throw answersError;
      }

      toast.success(editingExam ? 'Final exam updated successfully' : 'Final exam created successfully');
      onExamSaved({ ...formData, id: examId! } as FinalExam);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving final exam:', error);
      toast.error('Failed to save final exam');
    } finally {
      setLoading(false);
    }
  };

  const difficultyDistribution = () => {
    const total = questions.length;
    if (total === 0) return { easy: 0, moderate: 0, application: 0, advanced: 0 };

    const counts = questions.reduce((acc, q) => {
      acc[q.difficulty_level]++;
      return acc;
    }, { easy: 0, moderate: 0, application: 0, advanced: 0 });

    return {
      easy: Math.round((counts.easy / total) * 100),
      moderate: Math.round((counts.moderate / total) * 100),
      application: Math.round((counts.application / total) * 100),
      advanced: Math.round((counts.advanced / total) * 100)
    };
  };

  const distribution = difficultyDistribution();

  const GradientButton = ({ children, ...props }: any) => (
    <Button
      {...props}
      className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
    >
      {children}
    </Button>
  );

  const GradientIcon = () => (
    <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-2 rounded-lg">
      <GraduationCap className="h-5 w-5 text-white" />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50/50 border-0 shadow-2xl">
        <DialogHeader className="space-y-4">
          <div className="flex items-center space-x-3">
            <GradientIcon />
            <DialogTitle className="bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent text-2xl font-bold">
              {editingExam ? 'Edit Final Exam' : 'Create Final Exam'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Exam Details Card */}
          <Card className="border-l-4 border-l-orange-500 shadow-sm">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-semibold text-gray-700 flex items-center">
                    <GraduationCap className="h-4 w-4 mr-2 text-orange-500" />
                    Exam Title
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time_limit" className="text-sm font-semibold text-gray-700 flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-blue-500" />
                    Time Limit (minutes)
                  </Label>
                  <Input
                    id="time_limit"
                    type="number"
                    value={formData.time_limit_minutes}
                    onChange={(e) => setFormData({ ...formData, time_limit_minutes: parseInt(e.target.value) })}
                    min="30"
                    max="180"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional exam description"
                  className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="passing_score" className="text-sm font-semibold text-gray-700 flex items-center">
                    <Target className="h-4 w-4 mr-2 text-green-500" />
                    Passing Score (%)
                  </Label>
                  <Input
                    id="passing_score"
                    type="number"
                    value={formData.passing_score}
                    onChange={(e) => setFormData({ ...formData, passing_score: parseInt(e.target.value) })}
                    min="50"
                    max="100"
                    className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="is_published"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <Label htmlFor="is_published" className="text-sm font-semibold text-gray-700">
                    Publish Exam
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Question Distribution Card */}
          {questions.length > 0 && (
            <Card className="bg-gradient-to-r from-orange-50 to-purple-50 border border-orange-200">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Question Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                    Easy/Moderate: {distribution.easy + distribution.moderate}%
                  </Badge>
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                    Application: {distribution.application}%
                  </Badge>
                  <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
                    Advanced: {distribution.advanced}%
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  <CheckCircle className="h-3 w-3 inline mr-1 text-green-500" />
                  Recommended: 60% Easy/Moderate, 30% Application, 10% Advanced
                </p>
              </CardContent>
            </Card>
          )}

          {/* Questions Section */}
          <Card className="border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-lg font-semibold text-gray-800">Questions ({questions.length})</Label>
                <Button 
                  type="button" 
                  onClick={addQuestion} 
                  size="sm"
                  className="bg-gradient-to-r from-orange-500 to-purple-600 text-white hover:opacity-90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>

              <div className="space-y-4">
                {questions.map((question, questionIndex) => (
                  <Card key={questionIndex} className="border border-gray-200 bg-white">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold flex items-center">
                          <div className="bg-gradient-to-r from-orange-500 to-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-2">
                            {questionIndex + 1}
                          </div>
                          Question {questionIndex + 1}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Select
                            value={question.difficulty_level}
                            onValueChange={(value) => updateQuestion(questionIndex, 'difficulty_level', value)}
                          >
                            <SelectTrigger className="w-32 border-gray-300 focus:border-orange-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy" className="text-green-600">Easy</SelectItem>
                              <SelectItem value="moderate" className="text-yellow-600">Moderate</SelectItem>
                              <SelectItem value="application" className="text-blue-600">Application</SelectItem>
                              <SelectItem value="advanced" className="text-purple-600">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeQuestion(questionIndex)}
                            className="border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Textarea
                        value={question.question}
                        onChange={(e) => updateQuestion(questionIndex, 'question', e.target.value)}
                        placeholder="Enter your question here..."
                        className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                        required
                      />
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-gray-700">Answers</Label>
                        {question.answers.map((answer, answerIndex) => (
                          <div key={answerIndex} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                            <input
                              type="radio"
                              name={`correct-${questionIndex}`}
                              checked={answer.is_correct}
                              onChange={() => updateAnswer(questionIndex, answerIndex, 'is_correct', true)}
                              className="rounded-full border-gray-300 text-orange-500 focus:ring-orange-500"
                            />
                            <Input
                              value={answer.answer}
                              onChange={(e) => updateAnswer(questionIndex, answerIndex, 'answer', e.target.value)}
                              placeholder={`Answer ${answerIndex + 1}`}
                              className="border-0 bg-transparent focus:ring-0"
                              required
                            />
                            {answer.is_correct && (
                              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Correct
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <DialogFooter className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <GradientButton 
              type="submit" 
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {editingExam ? 'Updating Exam...' : 'Creating Exam...'}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {editingExam ? 'Update Exam' : 'Create Exam'}
                </>
              )}
            </GradientButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FinalExamFormDialog;
