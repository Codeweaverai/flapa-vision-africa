
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Clock, Target, RotateCcw, BookOpen } from 'lucide-react';

interface Quiz {
  id: string;
  title: string;
  description?: string;
  passing_score: number;
}

interface QuizInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: Quiz;
  onStartQuiz: () => void;
}

const QuizInstructionsModal = ({ isOpen, onClose, quiz, onStartQuiz }: QuizInstructionsModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <Award className="h-8 w-8 text-orange-500" />
            {quiz.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {quiz.description && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">{quiz.description}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <Target className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <div className="font-semibold text-lg">{quiz.passing_score}%</div>
              <div className="text-sm text-gray-600">Passing Score</div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <div className="font-semibold text-lg">No Limit</div>
              <div className="text-sm text-gray-600">Time Limit</div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <RotateCcw className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <div className="font-semibold text-lg">Unlimited</div>
              <div className="text-sm text-gray-600">Attempts</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-50 to-purple-50 p-6 rounded-lg">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-orange-500" />
              Quiz Instructions
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">•</span>
                Read each question carefully before selecting your answer
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">•</span>
                You need to score at least {quiz.passing_score}% to pass this quiz
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">•</span>
                If you don't pass, you can retake the quiz as many times as needed
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">•</span>
                Take your time - there's no time limit for this quiz
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 font-bold">•</span>
                Review the lesson material if you need to refresh your knowledge
              </li>
            </ul>
          </div>
          
          <div className="flex justify-between items-center pt-4">
            <Button variant="outline" onClick={onClose}>
              Review Material
            </Button>
            <Button 
              onClick={onStartQuiz}
              className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white px-8"
              size="lg"
            >
              <Award className="h-5 w-5 mr-2" />
              Start Quiz
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuizInstructionsModal;
