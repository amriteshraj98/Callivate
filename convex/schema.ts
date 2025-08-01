import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";


export default defineSchema({
    users : defineTable({
        name : v.string(),
        email : v.string(),
        image : v.optional(v.string()),
        role : v.union(v.literal("candidate"),v.literal("interviewer")),
        clerkId: v.string(),
    }).index("by_clerk_id",["clerkId"]),
     interviews: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    status: v.string(),
    streamCallId: v.string(),
    candidateId: v.string(),
    interviewerIds: v.array(v.string()),
  })
    .index("by_candidate_id", ["candidateId"])
    .index("by_stream_call_id", ["streamCallId"]),

  comments: defineTable({
    content: v.string(),
    rating: v.number(),
    interviewerId: v.string(),
    interviewId: v.id("interviews"),
  }).index("by_interview_id", ["interviewId"]),

  questions: defineTable({
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
    createdBy: v.string(), // clerkId of the user who created the question
    isDefault: v.optional(v.boolean()), // to mark default questions
  })
    .index("by_created_by", ["createdBy"])
    .index("by_default", ["isDefault"]),
});