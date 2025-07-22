
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react';

export interface FinalExamResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  examResult: {
    id: string;
    score: number;
    percentage_score: number;
    passed: boolean;
    attempt_number: number;
    completed_at: string;
    final_grade: number;
  };
  onRetake: () => void;
}

const FinalExamResultsModal: React.FC<FinalExamResultsModalProps> = ({
  isOpen,
  onClose,
  examResult,
  onRetake,
}) => {
  const canRetake = !examResult.passed && examResult.attempt_number < 3;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {examResult.passed ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
            Final Exam Results
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">
                    {examResult.percentage_score.toFixed(1)}%
                  </h3>
                  <Badge
                    variant={examResult.passed ? "default" : "destructive"}
                    className="text-sm"
                  >
                    {examResult.passed ? "PASSED" : "FAILED"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Score</p>
                    <p className="text-lg font-semibold">{examResult.score}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Final Grade</p>
                    <p className="text-lg font-semibold">{examResult.final_grade.toFixed(1)}</p>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>Attempt #{examResult.attempt_number}</p>
                  <p>Completed: {new Date(examResult.completed_at).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {examResult.passed ? (
            <div className="text-center space-y-2">
              <p className="text-green-700 font-medium">
                🎉 Congratulations! You have successfully completed the course!
              </p>
              <p className="text-sm text-muted-foreground">
                You can now download your completion certificate.
              </p>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <p className="text-red-700 font-medium">
                You need to score at least 70% to pass the exam.
              </p>
              {canRetake ? (
                <p className="text-sm text-muted-foreground">
                  You have {3 - examResult.attempt_number} attempt(s) remaining.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  You have used all your attempts for this exam.
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {canRetake && (
            <Button onClick={onRetake} className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Retake Exam
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FinalExamResultsModal;
