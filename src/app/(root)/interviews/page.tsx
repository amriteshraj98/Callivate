"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import InterviewCard from "@/components/InterviewCard";
import LoaderUI from "@/components/LoaderUI";
import { useUserRole } from "@/hooks/useUserRole";

function InterviewsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { isInterviewer, isCandidate } = useUserRole();

  // Get interviews based on user role
  const myInterviews = useQuery(api.interviews.getMyInterviews);
  const interviewerInterviews = useQuery(api.interviews.getInterviewsByInterviewer);

  const interviews = isInterviewer ? interviewerInterviews : myInterviews;

  // Filter interviews by status
  const filteredInterviews = interviews?.filter((interview: any) => {
    if (statusFilter === "all") return true;
    return interview.status === statusFilter;
  }) || [];

  if (interviews === undefined) {
    return <LoaderUI />;
  }

  return (
    <div className="container max-w-7xl mx-auto p-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Interviews</h1>
          <p className="text-muted-foreground my-1">
            {filteredInterviews.length} {filteredInterviews.length === 1 ? "interview" : "interviews"} found
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Filter by status:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All interviews" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All interviews</SelectItem>
              <SelectItem value="upcoming">Scheduled</SelectItem>
              <SelectItem value="live">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* INTERVIEWS GRID */}
      <ScrollArea className="h-[calc(100vh-12rem)]">
        {filteredInterviews.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
            {filteredInterviews.map((interview: any) => (
              <InterviewCard key={interview._id} interview={interview} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[400px] gap-4">
            <p className="text-xl font-medium text-muted-foreground">
              {statusFilter === "all" 
                ? "No interviews found" 
                : `No ${statusFilter} interviews found`
              }
            </p>
            {statusFilter !== "all" && (
              <button
                onClick={() => setStatusFilter("all")}
                className="text-sm text-primary hover:underline"
              >
                View all interviews
              </button>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

export default InterviewsPage; 