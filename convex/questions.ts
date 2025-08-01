import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all questions for a user
export const getQuestions = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("User is not authenticated");

    const clerkId = identity.subject;

    // Get user's own questions
    const userQuestions = await ctx.db
      .query("questions")
      .withIndex("by_created_by", (q) => q.eq("createdBy", clerkId))
      .collect();

    return userQuestions;
  },
});

// Get a specific question by ID
export const getQuestionById = query({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    const question = await ctx.db.get(args.questionId);
    return question;
  },
});

// Create a new question
export const createQuestion = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    examples: v.array(v.object({
      input: v.string(),
      output: v.string(),
      explanation: v.optional(v.string()),
    })),
    starterCode: v.object({
      javascript: v.string(),
      python: v.string(),
      java: v.string(),
      cpp: v.string(),
    }),
    constraints: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("User is not authenticated");

    const clerkId = identity.subject;

    return await ctx.db.insert("questions", {
      ...args,
      createdBy: clerkId,
      isDefault: false,
    });
  },
});

// Update an existing question
export const updateQuestion = mutation({
  args: {
    questionId: v.id("questions"),
    title: v.string(),
    description: v.string(),
    examples: v.array(v.object({
      input: v.string(),
      output: v.string(),
      explanation: v.optional(v.string()),
    })),
    starterCode: v.object({
      javascript: v.string(),
      python: v.string(),
      java: v.string(),
      cpp: v.string(),
    }),
    constraints: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("User is not authenticated");

    const clerkId = identity.subject;
    const { questionId, ...updateData } = args;

    // Check if user owns this question
    const question = await ctx.db.get(questionId);
    if (!question) throw new Error("Question not found");
    if (question.createdBy !== clerkId) throw new Error("Not authorized to update this question");

    return await ctx.db.patch(questionId, updateData);
  },
});

// Delete a question
export const deleteQuestion = mutation({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("User is not authenticated");

    const clerkId = identity.subject;

    // Check if user owns this question
    const question = await ctx.db.get(args.questionId);
    if (!question) throw new Error("Question not found");
    if (question.createdBy !== clerkId) throw new Error("Not authorized to delete this question");

    return await ctx.db.delete(args.questionId);
  },
});

// Clear all questions (for resetting the database)
export const clearAllQuestions = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("User is not authenticated");

    // Get all questions
    const allQuestions = await ctx.db.query("questions").collect();
    
    // Delete all questions
    for (const question of allQuestions) {
      await ctx.db.delete(question._id);
    }

    return `Cleared ${allQuestions.length} questions`;
  },
}); 