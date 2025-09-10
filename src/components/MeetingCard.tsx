import useMeetingActions from "@/hooks/useMeetingActions";
import { Doc } from "../../convex/_generated/dataModel";
import { getMeetingStatus } from "@/lib/utils";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { CalendarIcon, Clock, MessageCircle, CheckCircle, XCircle, Star } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useState } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import InterviewReviewDialog from "./InterviewReviewDialog";
import InterviewResultDisplay from "./InterviewResultDisplay";
import toast from "react-hot-toast";

type Interview = Doc<"interviews">;

function MeetingCard({ interview }: { interview: Interview }) {
  const { joinMeeting } = useMeetingActions();
  const { isInterviewer } = useUserRole();
  const updateInterviewResult = useMutation(api.interviews.updateInterviewResult);
  
  const [showResultDisplay, setShowResultDisplay] = useState(false);

  const status = getMeetingStatus(interview);
  const formattedDate = format(new Date(interview.startTime), "MMM dd");
  const formattedTime = format(new Date(interview.startTime), "h:mm a");
  
  // Format duration if end time is available
  const formattedDuration = interview.endTime 
    ? `${format(new Date(interview.startTime), "h:mm a")} - ${format(new Date(interview.endTime), "h:mm a")}`
    : formattedTime;

  const handleQuickResult = async (result: "pass" | "fail") => {
    try {
      await updateInterviewResult({
        interviewId: interview._id,
        result,
      });
      toast.success(`Interview marked as ${result.toUpperCase()}`);
    } catch (error) {
      toast.error("Failed to update interview result");
    }
  };



  const isCompleted = status === "completed";
  const hasResult = interview.result;
  const hasReview = interview.review;

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarIcon className="h-4 w-4" />
            {formattedDate}
            <Clock className="h-4 w-4 ml-2" />
            {formattedDuration}
          </div>

          <Badge
            variant={
              status === "live" ? "default" : status === "upcoming" ? "secondary" : "outline"
            }
          >
            {status === "live" ? "Live Now" : status === "upcoming" ? "Upcoming" : "Completed"}
          </Badge>
        </div>

        <CardTitle>{interview.title}</CardTitle>

        {interview.description && (
          <CardDescription className="line-clamp-2">{interview.description}</CardDescription>
        )}

        {/* Show result badge if interview has been reviewed */}
        {hasResult && (
          <div className="flex items-center gap-2">
            {interview.result === "pass" ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
            <Badge
              variant={interview.result === "pass" ? "default" : "destructive"}
              className="text-xs"
            >
              {interview.result!.toUpperCase()}
            </Badge>
            {hasReview && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                <span className="text-xs text-muted-foreground">
                  {interview.review!.rating}/5
                </span>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {status === "live" && (
          <Button className="w-full" onClick={() => joinMeeting(interview.streamCallId)}>
            Join Meeting
          </Button>
        )}

        {status === "upcoming" && (
          <Button variant="outline" className="w-full" disabled>
            Waiting to Start
          </Button>
        )}

        {isCompleted && (
          <div className="space-y-3">
            {/* Pass/Fail Buttons for Interviewers */}
            {isInterviewer && !hasResult && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                  onClick={() => handleQuickResult("pass")}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Pass
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 bg-red-50 hover:bg-red-100 border-red-200 text-red-700"
                  onClick={() => handleQuickResult("fail")}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Fail
                </Button>
              </div>
            )}

            

                         {/* Review Button for Interviewers */}
             {isInterviewer && isCompleted && (
               <InterviewReviewDialog
                 interviewId={interview._id}
                 trigger={
                   <Button
                     variant="outline"
                     className="w-full"
                   >
                     <Star className="w-4 h-4 mr-2" />
                     {hasReview ? "Update Review" : "Submit Review"}
                   </Button>
                 }
               />
             )}

             {/* View Result Button for Candidates */}
             {!isInterviewer && isCompleted && hasReview && (
               <Button
                 variant="outline"
                 className="w-full"
                 onClick={() => setShowResultDisplay(true)}
               >
                 <Star className="w-4 h-4 mr-2" />
                 View Review
               </Button>
             )}

             {/* Review Pending for Candidates */}
             {!isInterviewer && isCompleted && !hasReview && (
               <Button
                 variant="outline"
                 className="w-full"
                 disabled
               >
                 <Star className="w-4 h-4 mr-2" />
                 Review Pending
               </Button>
             )}
          </div>
        )}
      </CardContent>

      

      {/* Result Display Dialog */}
      {showResultDisplay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Interview Review</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowResultDisplay(false)}
                >
                  ×
                </Button>
              </div>
              <InterviewResultDisplay interview={interview} />
            </div>
          </div>
        </div>
      )}


    </Card>
  );
}

export default MeetingCard;
