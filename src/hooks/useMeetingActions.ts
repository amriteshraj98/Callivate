import { useRouter } from "next/navigation";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";

const useMeetingActions = () => {
  const router = useRouter();
  const client = useStreamVideoClient();
  const { user } = useUser();
  const createInterview = useMutation(api.interviews.createInterview);

  const createInstantMeeting = async () => {
    if (!client || !user) return;

    try {
      const id = crypto.randomUUID(); // generating a random id 
      const call = client.call("default", id); // it will create a new call 
      // creating call with stream sdk 
      await call.getOrCreate({
        data: {
          starts_at: new Date().toISOString(),
          custom: {
            description: "Instant Meeting",
          },
        },
      });

      // Create interview record for instant meetings
      await createInterview({
        title: "Instant Meeting",
        description: "Instant meeting created on demand",
        startTime: Date.now(),
        status: "live",
        streamCallId: id,
        candidateId: user.id, // Initially set creator as candidate, will be updated when real candidate joins
        interviewerIds: [user.id], // Creator is the interviewer
      });

      // pushing user to meeting
      router.push(`/meeting/${call.id}`);
      toast.success("Meeting Created");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create meeting");
    }
  };

  const joinMeeting = (callId: string) => {
    if (!client) return toast.error("Failed to join meeting. Please try again.");
    // push the user into meeting
    router.push(`/meeting/${callId}`);
  };

  return { createInstantMeeting, joinMeeting };
};

export default useMeetingActions;