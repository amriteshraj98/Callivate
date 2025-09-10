import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { 
  CalendarIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  EyeIcon,
  UserIcon
} from "lucide-react";
import { format } from "date-fns";
import InterviewReviewDialog from "./InterviewReviewDialog";
import InterviewReviewDisplay from "./InterviewReviewDisplay";
import { useUserRole } from "@/hooks/useUserRole";

interface InterviewCardProps {
  interview: {
    _id: string;
    title: string;
    description?: string;
    startTime: number;
    endTime?: number;
    status: string;
    candidateId: string;
    interviewerIds: string[];
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
}

export default function InterviewCard({ interview }: InterviewCardProps) {
  const { isInterviewer, isCandidate } = useUserRole();
  
  // Get candidate and interviewer details
  const candidate = useQuery(api.users.getUserByClerkId, {
    clerkId: interview.candidateId,
  });

  const interviewers = useQuery(api.users.getUsers);

  const getInterviewerNames = () => {
    if (!interviewers) return [];
    return interviewers
      .filter(user => interview.interviewerIds.includes(user.clerkId))
      .map(user => user.name);
  };

  const formatDuration = (startTime: number, endTime?: number, status?: string) => {
    // For missed interviews, show "Missed" instead of duration
    if (status === "missed") return "Missed";
    
    // For live interviews without end time, show "Ongoing"
    if (!endTime && status === "live") return "Ongoing";
    
    // For scheduled interviews without end time, show "Not Started"
    if (!endTime && status === "scheduled") return "Not Started";
    
    // For completed interviews, calculate actual duration
    if (endTime) {
      const duration = endTime - startTime;
      const minutes = Math.floor(duration / 60000);
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      
      if (hours > 0) {
        return `${hours}h ${remainingMinutes}m`;
      }
      return `${minutes}m`;
    }
    
    return "Unknown";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
      case "scheduled":
        return <Badge variant="secondary">Scheduled</Badge>;
      case "live":
        return <Badge variant="default">In Progress</Badge>;
      case "completed":
        return <Badge variant="outline">Completed</Badge>;
      case "missed":
        return <Badge variant="destructive">Missed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getResultBadge = (result?: "pass" | "fail") => {
    if (!result) return null;
    
    return (
      <Badge variant={result === "pass" ? "default" : "destructive"} className="gap-1">
        {result === "pass" ? (
          <CheckCircleIcon className="h-3 w-3" />
        ) : (
          <XCircleIcon className="h-3 w-3" />
        )}
        {result.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card className="hover:shadow-md transition-all">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{interview.title}</CardTitle>
            {interview.description && (
              <p className="text-sm text-muted-foreground">{interview.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            {getStatusBadge(interview.status)}
            {getResultBadge(interview.result)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Interview Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
              <span>{format(new Date(interview.startTime), "PPP")}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <ClockIcon className="h-4 w-4" />
              <span>{format(new Date(interview.startTime), "p")} - {interview.endTime ? format(new Date(interview.endTime), "p") : "Ongoing"}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <ClockIcon className="h-4 w-4" />
              <span>Duration: {formatDuration(interview.startTime, interview.endTime, interview.status)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <UserIcon className="h-4 w-4" />
              <span>Candidate: {candidate?.name || "Unknown"}</span>
            </div>
            <div className="flex items-start gap-2 text-muted-foreground">
              <UserIcon className="h-4 w-4 mt-0.5" />
              <span>Interviewers: {getInterviewerNames().join(", ") || "Unknown"}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {/* Interviewer Actions */}
          {isInterviewer && interview.status === "completed" && (
            <InterviewReviewDialog 
              interviewId={interview._id as any}
              trigger={
                <Button className="gap-2">
                  <CheckCircleIcon className="h-4 w-4" />
                  {interview.result ? "Update Review" : "Submit Review"}
                </Button>
              }
            />
          )}

          {/* Candidate Actions */}
          {isCandidate && interview.status === "completed" && interview.review && (
            <InterviewReviewDisplay 
              interview={interview}
              trigger={
                <Button variant="outline" className="gap-2">
                  <EyeIcon className="h-4 w-4" />
                  View Review
                </Button>
              }
            />
          )}

          {isCandidate && interview.status === "completed" && !interview.review && (
            <Button variant="outline" disabled className="gap-2">
              <EyeIcon className="h-4 w-4" />
              Review Pending
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 