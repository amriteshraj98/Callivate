"use client";
import { useMarkMissedInterviews } from "@/hooks/useMarkMissedInterviews";

export default function MissedInterviewMarker() {
  useMarkMissedInterviews();
  return null; // This component doesn't render anything
}
