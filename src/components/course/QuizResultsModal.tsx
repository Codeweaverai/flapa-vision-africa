
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, RotateCcw, ArrowRight, Trophy, Target } from 'lucide-react';

interface Quiz {
  id: string;
  title: string;
  passing_score: number;
}

interface QuizResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: Quiz;
  score: number;
  passed: boolean;
  onRetake: () => void;
  onProceed: () => void;
  hasNextContent: boolean;
}

const QuizResultsModal = ({ 
  isOpen, 
  onClose, 
  quiz, 
  score, 
  passed, 
  onRetake, 
  onProceed, 
  hasNextContent 
}: QuizResultsModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            Quiz Results
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 text-center">
          {/* Result Icon and Score */}
          <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center ${
            passed ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {passed ? (
              <CheckCircle className="h-12 w-12 text-green-500" />
            ) : (
              <XCircle className="h-12 w-12 text-red-500" />
            )}
          </div>
          
          <div>
            <div className="text-4xl font-bold mb-2">{score}%</div>
            <Badge 
              variant={passed ? "default" : "destructive"}
              className={passed ? "bg-green-500" : ""}
            >
              {passed ? "PASSED" : "FAILED"}
            </Badge>
          </div>
          
          {/* Quiz Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">{quiz.title}</h3>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                Required: {quiz.passing_score}%
              </div>
              <div className="flex items-center gap-1">
                <Trophy className="h-4 w-4" />
                Your Score: {score}%
              </div>
            </div>
          </div>
          
          {/* Result Message */}
          {passed ? (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Congratulations! 🎉</h3>
              <p className="text-green-700">
                You've successfully passed this quiz! You can now proceed to the next part of the course.
              </p>
            </div>
          ) : (
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">Try Again</h3>
              <p className="text-red-700">
                You need {quiz.passing_score}% to pass. Review the lesson material and try again when you're ready.
              </p>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            {!passed && (
              <Button 
                onClick={onRetake}
                className="flex-1 bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Retake Quiz
              </Button>
            )}
            
            {passed && hasNextContent && (
              <Button 
                onClick={onProceed}
                className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Continue Learning
              </Button>
            )}
            
            {passed && !hasNextContent && (
              <div className="flex-1">
                <Badge variant="secondary" className="bg-green-100 text-green-800 p-3">
                  <Trophy className="h-4 w-4 mr-2" />
                  Course Complete!
                </Badge>
              </div>
            )}
          </div>
          
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuizResultsModal;
