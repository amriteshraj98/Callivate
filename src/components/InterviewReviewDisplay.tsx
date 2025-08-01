import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { 
  StarIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  EyeIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  CalendarIcon,
  UserIcon
} from "lucide-react";
import { format } from "date-fns";

interface InterviewReviewDisplayProps {
  interview: {
    _id: string;
    title: string;
    result?: "pass" | "fail";
    review?: {
      rating: number;
      feedback: string;
      strengths?: string[];
      areasForImprovement?: string[];
      overallAssessment: string;
      recommendedForNextRound?: boolean;
    };
    reviewedAt?: number;
    reviewedBy?: string;
  };
  trigger?: React.ReactNode;
}

export default function InterviewReviewDisplay({ interview, trigger }: InterviewReviewDisplayProps) {
  const [open, setOpen] = useState(false);

  if (!interview.review) {
    return null;
  }

  const { review, result, reviewedAt } = interview;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <EyeIcon className="h-4 w-4" />
            View Review
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Interview Review
            {result && (
              <Badge variant={result === "pass" ? "default" : "destructive"} className="gap-1">
                {result === "pass" ? (
                  <CheckCircleIcon className="h-3 w-3" />
                ) : (
                  <XCircleIcon className="h-3 w-3" />
                )}
                {result.toUpperCase()}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Interview Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{interview.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {reviewedAt && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Reviewed on {format(new Date(reviewedAt), "PPP 'at' p")}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rating */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Overall Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <StarIcon
                      key={i}
                      className={`h-5 w-5 ${
                        i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-lg font-semibold">{review.rating}/5</span>
              </div>
            </CardContent>
          </Card>

          {/* Feedback */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detailed Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-line">{review.feedback}</p>
            </CardContent>
          </Card>

          {/* Strengths */}
          {review.strengths && review.strengths.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ThumbsUpIcon className="h-5 w-5 text-green-600" />
                  Key Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {review.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Areas for Improvement */}
          {review.areasForImprovement && review.areasForImprovement.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ThumbsDownIcon className="h-5 w-5 text-orange-600" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {review.areasForImprovement.map((area, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm">{area}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Overall Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Overall Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-line">{review.overallAssessment}</p>
            </CardContent>
          </Card>

          {/* Recommendation */}
          {review.recommendedForNextRound !== undefined && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recommendation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {review.recommendedForNextRound ? (
                    <>
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-600">
                        Recommended for next round
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircleIcon className="h-5 w-5 text-red-600" />
                      <span className="text-sm font-medium text-red-600">
                        Not recommended for next round
                      </span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Button */}
          <div className="flex justify-end">
            <Button onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 