"use client"
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export const useClearQuestions = () => {
  const clearAllQuestions = useMutation(api.questions.clearAllQuestions);

  const clearQuestions = async () => {
    try {
      const result = await clearAllQuestions();
      console.log("Questions cleared:", result);
      return result;
    } catch (error) {
      console.error("Failed to clear questions:", error);
      throw error;
    }
  };

  return { clearQuestions };
}; 