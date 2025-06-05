
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Trash2, GraduationCap } from 'lucide-react';
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-orange-500" />
            {editingExam ? 'Edit Final Exam' : 'Create Final Exam'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Exam Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="time_limit">Time Limit (minutes)</Label>
              <Input
                id="time_limit"
                type="number"
                value={formData.time_limit_minutes}
                onChange={(e) => setFormData({ ...formData, time_limit_minutes: parseInt(e.target.value) })}
                min="30"
                max="180"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional exam description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="passing_score">Passing Score (%)</Label>
              <Input
                id="passing_score"
                type="number"
                value={formData.passing_score}
                onChange={(e) => setFormData({ ...formData, passing_score: parseInt(e.target.value) })}
                min="50"
                max="100"
                required
              />
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="is_published"
                checked={formData.is_published}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="is_published">Publish Exam</Label>
            </div>
          </div>

          {questions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Question Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">Easy/Moderate: {distribution.easy + distribution.moderate}%</Badge>
                  <Badge variant="outline">Application: {distribution.application}%</Badge>
                  <Badge variant="outline">Advanced: {distribution.advanced}%</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Recommended: 60% Easy/Moderate, 30% Application, 10% Advanced
                </p>
              </CardContent>
            </Card>
          )}

          <div>
            <div className="flex items-center justify-between mb-4">
              <Label>Questions ({questions.length})</Label>
              <Button type="button" onClick={addQuestion} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>

            <div className="space-y-4">
              {questions.map((question, questionIndex) => (
                <Card key={questionIndex}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Question {questionIndex + 1}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Select
                          value={question.difficulty_level}
                          onValueChange={(value) => updateQuestion(questionIndex, 'difficulty_level', value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="moderate">Moderate</SelectItem>
                            <SelectItem value="application">Application</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeQuestion(questionIndex)}
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
                      required
                    />
                    
                    <div className="space-y-2">
                      <Label className="text-sm">Answers</Label>
                      {question.answers.map((answer, answerIndex) => (
                        <div key={answerIndex} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${questionIndex}`}
                            checked={answer.is_correct}
                            onChange={() => updateAnswer(questionIndex, answerIndex, 'is_correct', true)}
                            className="rounded"
                          />
                          <Input
                            value={answer.answer}
                            onChange={(e) => updateAnswer(questionIndex, answerIndex, 'answer', e.target.value)}
                            placeholder={`Answer ${answerIndex + 1}`}
                            required
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (editingExam ? 'Update Exam' : 'Create Exam')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FinalExamFormDialog;
