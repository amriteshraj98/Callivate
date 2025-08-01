"use client";

import { Doc } from "../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Star, CheckCircle, XCircle, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";

type Interview = Doc<"interviews">;

interface InterviewResultDisplayProps {
  interview: Interview;
}

export default function InterviewResultDisplay({ interview }: InterviewResultDisplayProps) {
  if (!interview.result || !interview.review) {
    return null;
  }

  const { result, review, reviewedAt } = interview;

  return (
    <div className="space-y-4">
      {/* Result Badge */}
      <div className="flex items-center gap-2">
        {result === "pass" ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
          <XCircle className="w-5 h-5 text-red-500" />
        )}
        <Badge
          variant={result === "pass" ? "default" : "destructive"}
          className="text-sm font-medium"
        >
          {result.toUpperCase()}
        </Badge>
        {reviewedAt && (
          <span className="text-sm text-muted-foreground">
            Reviewed on {format(new Date(reviewedAt), "MMM dd, yyyy")}
          </span>
        )}
      </div>

      {/* Rating */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Overall Rating</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= review.rating
                      ? "text-yellow-500 fill-current"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {review.rating} out of 5 stars
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detailed Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {review.feedback}
          </p>
        </CardContent>
      </Card>

      {/* Strengths */}
      {review.strengths && review.strengths.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Key Strengths</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {review.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
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
            <CardTitle className="text-lg">Areas for Improvement</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {review.areasForImprovement.map((area, index) => (
                <li key={index} className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
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
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {review.overallAssessment}
          </p>
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
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <span className="text-sm font-medium">
                {review.recommendedForNextRound
                  ? "Recommended for next round"
                  : "Not recommended for next round"}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 