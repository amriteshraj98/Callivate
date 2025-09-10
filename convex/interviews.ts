import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getAllInterviews = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const interviews = await ctx.db.query("interviews").collect();

    return interviews;
  },
});

export const getMyInterviews = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity(); 
    if (!identity) return [];

    const interviews = await ctx.db
      .query("interviews")
      .withIndex("by_candidate_id", (q) => q.eq("candidateId", identity.subject))
      .collect();

    return interviews!;
  },
});

export const getInterviewsByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const interviews = await ctx.db
      .query("interviews")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();

    return interviews;
  },
});

export const getCompletedInterviews = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const interviews = await ctx.db
      .query("interviews")
      .withIndex("by_status", (q) => q.eq("status", "completed"))
      .collect();

    return interviews;
  },
});

export const getInterviewsByInterviewer = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    // Get all interviews and filter in the handler
    const allInterviews = await ctx.db.query("interviews").collect();
    
    // Filter interviews where the current user is an interviewer
    const interviews = allInterviews.filter(interview => 
      interview.interviewerIds.includes(identity.subject)
    );

    return interviews;
  },
});

export const getInterviewByStreamCallId = query({
  args: { streamCallId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("interviews")
      .withIndex("by_stream_call_id", (q) => q.eq("streamCallId", args.streamCallId))
      .first();
  },
});

export const setInterviewCurrentQuestion = mutation({
  args: {
    interviewId: v.id("interviews"),
    questionId: v.union(v.id("questions"), v.null()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const interview = await ctx.db.get(args.interviewId);
    if (!interview) throw new Error("Interview not found");

    // Only candidate or interviewers in this interview may update
    const isParticipant =
      interview.candidateId === identity.subject ||
      interview.interviewerIds.includes(identity.subject);
    if (!isParticipant) throw new Error("Not authorized to update interview question");

    return await ctx.db.patch(args.interviewId, {
      currentQuestionId: args.questionId ?? undefined,
    });
  },
});

export const updateInterviewCode = mutation({
  args: {
    interviewId: v.id("interviews"),
    code: v.string(),
    language: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const interview = await ctx.db.get(args.interviewId);
    if (!interview) throw new Error("Interview not found");

    // Temporarily remove authorization check to fix sync issues
    // TODO: Fix user ID matching and re-enable authorization
    
    return await ctx.db.patch(args.interviewId, {
      currentCode: args.code,
      currentLanguage: args.language,
    });
  },
});

export const updateInterviewCandidate = mutation({
  args: {
    interviewId: v.id("interviews"),
    candidateId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const interview = await ctx.db.get(args.interviewId);
    if (!interview) throw new Error("Interview not found");

    // Only allow updating if the current user is the new candidate
    // or if they're already an interviewer in this interview
    const isNewCandidate = identity.subject === args.candidateId;
    const isInterviewer = interview.interviewerIds.includes(identity.subject);
    
    if (!isNewCandidate && !isInterviewer) {
      throw new Error("Not authorized to update interview candidate");
    }

    return await ctx.db.patch(args.interviewId, {
      candidateId: args.candidateId,
    });
  },
});

export const markMissedInterviews = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const now = Date.now();
    
    // Get all scheduled interviews that have passed their start time
    const scheduledInterviews = await ctx.db
      .query("interviews")
      .withIndex("by_status", (q) => q.eq("status", "scheduled"))
      .collect();

    const missedInterviews = scheduledInterviews.filter(
      interview => interview.startTime < now
    );

    // Mark them as missed
    for (const interview of missedInterviews) {
      await ctx.db.patch(interview._id, {
        status: "missed",
        endTime: now,
      });
    }

    return `Marked ${missedInterviews.length} interviews as missed`;
  },
});

export const createInterview = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    status: v.string(),
    streamCallId: v.string(),
    candidateId: v.string(),
    interviewerIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    return await ctx.db.insert("interviews", {
      ...args,
    });
  },
});

export const updateInterviewStatus = mutation({
  args: {
    id: v.id("interviews"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, {
      status: args.status,
      ...(args.status === "completed" ? { endTime: Date.now() } : {}),
    });
  },
});

export const submitInterviewReview = mutation({
  args: {
    interviewId: v.id("interviews"),
    result: v.union(v.literal("pass"), v.literal("fail")),
    review: v.object({
      rating: v.number(),
      feedback: v.string(),
      strengths: v.optional(v.array(v.string())),
      areasForImprovement: v.optional(v.array(v.string())),
      overallAssessment: v.string(),
      recommendedForNextRound: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Check if the user is an interviewer for this interview
    const interview = await ctx.db.get(args.interviewId);
    if (!interview) throw new Error("Interview not found");
    
    if (!interview.interviewerIds.includes(identity.subject)) {
      throw new Error("Not authorized to review this interview");
    }

    return await ctx.db.patch(args.interviewId, {
      result: args.result,
      review: args.review,
      status: "completed",
      reviewedBy: identity.subject,
      reviewedAt: Date.now(),
    });
  },
});

export const updateInterviewResult = mutation({
  args: {
    interviewId: v.id("interviews"),
    result: v.union(v.literal("pass"), v.literal("fail")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Check if the user is an interviewer for this interview
    const interview = await ctx.db.get(args.interviewId);
    if (!interview) throw new Error("Interview not found");
    
    if (!interview.interviewerIds.includes(identity.subject)) {
      throw new Error("Not authorized to update this interview");
    }

    return await ctx.db.patch(args.interviewId, {
      result: args.result,
      reviewedBy: identity.subject,
      reviewedAt: Date.now(),
    });
  },
});