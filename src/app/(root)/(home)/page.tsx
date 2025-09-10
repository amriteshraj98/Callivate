"use client";

import ActionCard from "@/components/ActionCard";
import { QUICK_ACTIONS } from "@/constants";
import { useUserRole } from "@/hooks/useUserRole";
import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import MeetingModal from "@/components/MeetingModal";
import LoaderUI from "@/components/LoaderUI";
import { Loader2Icon } from "lucide-react";
import MeetingCard from "@/components/MeetingCard";
import { groupInterviews } from "@/lib/utils";

export default function Home() {
  const router = useRouter();

  const { isInterviewer, isCandidate, isLoading } = useUserRole();
  const interviews = useQuery(api.interviews.getMyInterviews);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"start" | "join">();

  const handleQuickAction = (title: string) => {
    switch (title) {
      case "New Call":
        setModalType("start");
        setShowModal(true);
        break;
      case "Join Interview":
        setModalType("join");
        setShowModal(true);
        break;
      default:
        router.push(`/${title.toLowerCase()}`);
    }
  };

  if (isLoading) return <LoaderUI />;

  // Group interviews by status
  const groupedInterviews = groupInterviews(interviews ?? []);
  return (
    <div className="container max-w-7xl mx-auto p-6">
      {/* WELCOME SECTION */}
      <div className="rounded-lg bg-card p-6 border shadow-sm mb-10">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
          Welcome back!
        </h1>
        <p className="text-muted-foreground mt-2">
          {isInterviewer
            ? "Manage your interviews and review candidates effectively"
            : "Access your upcoming interviews and preparations"}
        </p>
      </div>

      {isInterviewer ? (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {QUICK_ACTIONS.map((action) => (
              <ActionCard
                key={action.title}
                action={action}
                onClick={() => handleQuickAction(action.title)}
              />
            ))}
          </div>

          <MeetingModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            title={modalType === "join" ? "Join Meeting" : "Start Meeting"}
            isJoinMeeting={modalType === "join"}
          />

          {/* Completed Interviews Section for Interviewers */}
          {groupedInterviews.completed && groupedInterviews.completed.length > 0 && (
            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Completed Interviews</h2>
                  <p className="text-muted-foreground mt-1">
                    Review and provide feedback for completed interviews
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {groupedInterviews.completed.length} completed
                  </span>
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {groupedInterviews.completed.map((interview) => (
                  <MeetingCard key={interview._id} interview={interview} />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Interviews Section */}
          {groupedInterviews.upcoming && groupedInterviews.upcoming.length > 0 && (
            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Upcoming Interviews</h2>
                  <p className="text-muted-foreground mt-1">
                    Your scheduled interviews
                  </p>
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {groupedInterviews.upcoming.map((interview) => (
                  <MeetingCard key={interview._id} interview={interview} />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div>
            <h1 className="text-3xl font-bold">Your Interviews</h1>
            <p className="text-muted-foreground mt-1">View and join your scheduled interviews</p>
          </div>

          <div className="mt-8">
            {interviews === undefined ? (
              <div className="flex justify-center py-12">
                <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : interviews.length > 0 ? (
              <div className="space-y-8">
                {/* Upcoming Interviews */}
                {groupedInterviews.upcoming && groupedInterviews.upcoming.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Upcoming Interviews</h2>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {groupedInterviews.upcoming.map((interview) => (
                        <MeetingCard key={interview._id} interview={interview} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed Interviews */}
                {groupedInterviews.completed && groupedInterviews.completed.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Completed Interviews</h2>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {groupedInterviews.completed.map((interview) => (
                        <MeetingCard key={interview._id} interview={interview} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                You have no scheduled interviews at the moment
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
