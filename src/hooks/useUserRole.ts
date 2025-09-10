import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

// created a custom hook that return the user role whether it is interviewer or candidate 
export const useUserRole = () => {
  const { user } = useUser(); // useUser is Clerk’s hook. useUser() tells you who is currently signed in (from Clerk). Get the currently logged-in Clerk user object.


  // Call your Convex query getUserByClerkId ().
  // The function requires one argument:ClerkId
  // Pass in the clerkId = the Clerk user’s ID.
  // If user is in the db we take it's role 
  // If no user is signed in, pass "" (empty string).
  const userData = useQuery(api.users.getUserByClerkId, {
    clerkId: user?.id || "",
  });

  const isLoading = userData === undefined;

  return {
    isLoading,
    isInterviewer: userData?.role === "interviewer",
    isCandidate: userData?.role === "candidate",
  };
};