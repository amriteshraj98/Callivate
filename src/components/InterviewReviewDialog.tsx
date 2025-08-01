"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { StarIcon, CheckCircleIcon, XCircleIcon } from "lucide-react";
import toast from "react-hot-toast";

interface InterviewReviewDialogProps {
  interviewId: Id<"interviews">;
  trigger?: React.ReactNode;
}

export default function InterviewReviewDialog({ interviewId, trigger }: InterviewReviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<"pass" | "fail" | null>(null);
  const [rating, setRating] = useState(3);
  const [feedback, setFeedback] = useState("");
  const [strengths, setStrengths] = useState("");
  const [areasForImprovement, setAreasForImprovement] = useState("");
  const [overallAssessment, setOverallAssessment] = useState("");
  const [recommendedForNextRound, setRecommendedForNextRound] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitReview = useMutation(api.interviews.submitInterviewReview);

  const handleSubmit = async () => {
    if (!result) {
      toast.error("Please select a result (Pass/Fail)");
      return;
    }

    if (!feedback.trim()) {
      toast.error("Please provide feedback");
      return;
    }

    if (!overallAssessment.trim()) {
      toast.error("Please provide an overall assessment");
      return;
    }

    setIsSubmitting(true);

    try {
      await submitReview({
        interviewId,
        result,
        review: {
          rating,
          feedback: feedback.trim(),
          strengths: strengths.trim() ? strengths.trim().split('\n').filter(s => s.trim()) : undefined,
          areasForImprovement: areasForImprovement.trim() ? areasForImprovement.trim().split('\n').filter(s => s.trim()) : undefined,
          overallAssessment: overallAssessment.trim(),
          recommendedForNextRound,
        },
      });

      toast.success("Review submitted successfully!");
      setOpen(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to submit review");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setResult(null);
    setRating(3);
    setFeedback("");
    setStrengths("");
    setAreasForImprovement("");
    setOverallAssessment("");
    setRecommendedForNextRound(true);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <CheckCircleIcon className="h-4 w-4" />
            Submit Review
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Interview Review</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Result Selection */}
          <div className="space-y-3">
            <Label>Interview Result *</Label>
            <div className="flex gap-3">
              <Button
                type="button"
                variant={result === "pass" ? "default" : "outline"}
                onClick={() => setResult("pass")}
                className="flex-1 gap-2"
              >
                <CheckCircleIcon className="h-4 w-4" />
                Pass
              </Button>
              <Button
                type="button"
                variant={result === "fail" ? "default" : "outline"}
                onClick={() => setResult("fail")}
                className="flex-1 gap-2"
              >
                <XCircleIcon className="h-4 w-4" />
                Fail
              </Button>
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-3">
            <Label>Rating *</Label>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(i + 1)}
                    className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded"
                  >
                    <StarIcon
                      className={`h-6 w-6 transition-colors ${
                        i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 hover:text-yellow-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-sm text-muted-foreground ml-2">
                {rating}/5
              </span>
            </div>
          </div>

          {/* Feedback */}
          <div className="space-y-3">
            <Label>Detailed Feedback *</Label>
            <Textarea
              placeholder="Provide detailed feedback about the candidate's performance..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
            />
          </div>

          {/* Strengths */}
          <div className="space-y-3">
            <Label>Key Strengths</Label>
            <Textarea
              placeholder="List the candidate's key strengths (one per line)..."
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              rows={3}
            />
          </div>

          {/* Areas for Improvement */}
          <div className="space-y-3">
            <Label>Areas for Improvement</Label>
            <Textarea
              placeholder="List areas where the candidate can improve (one per line)..."
              value={areasForImprovement}
              onChange={(e) => setAreasForImprovement(e.target.value)}
              rows={3}
            />
          </div>

          {/* Overall Assessment */}
          <div className="space-y-3">
            <Label>Overall Assessment *</Label>
            <Textarea
              placeholder="Provide a comprehensive overall assessment..."
              value={overallAssessment}
              onChange={(e) => setOverallAssessment(e.target.value)}
              rows={3}
            />
          </div>

          {/* Recommended for Next Round */}
          <div className="space-y-3">
            <Label>Recommended for Next Round</Label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="recommended"
                checked={recommendedForNextRound}
                onChange={(e) => setRecommendedForNextRound(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="recommended" className="text-sm">
                Recommend this candidate for the next round
              </Label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !result || !feedback.trim() || !overallAssessment.trim()}
              className="flex-1"
            >
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 