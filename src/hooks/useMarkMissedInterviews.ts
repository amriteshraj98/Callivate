"use client";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";

export const useMarkMissedInterviews = () => {
  const markMissedInterviews = useMutation(api.interviews.markMissedInterviews);

  useEffect(() => {
    // Mark missed interviews when the hook is first used
    markMissedInterviews().catch((error) => {
      console.error("Failed to mark missed interviews:", error);
    });
  }, [markMissedInterviews]);

  return { markMissedInterviews };
};
