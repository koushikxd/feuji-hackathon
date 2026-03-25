import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const updateRun = mutation({
  args: {
    runId: v.id("runs"),
    status: v.optional(
      v.union(
        v.literal("queued"),
        v.literal("starting"),
        v.literal("running"),
        v.literal("completed"),
        v.literal("failed"),
        v.literal("cancelled"),
      ),
    ),
    currentStep: v.optional(v.string()),
    errorMessage: v.optional(v.union(v.string(), v.null())),
    finishedAt: v.optional(v.number()),
    finalScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const patch: {
      currentStep?: string
      errorMessage?: string | undefined
      finalScore?: number
      finishedAt?: number
      status?: "cancelled" | "completed" | "failed" | "queued" | "running" | "starting"
      updatedAt: number
    } = {
      updatedAt: Date.now(),
    }

    if (args.status !== undefined) {
      patch.status = args.status
    }

    if (args.currentStep !== undefined) {
      patch.currentStep = args.currentStep
    }

    if (args.errorMessage !== undefined) {
      patch.errorMessage = args.errorMessage ?? undefined
    }

    if (args.finishedAt !== undefined) {
      patch.finishedAt = args.finishedAt
    }

    if (args.finalScore !== undefined) {
      patch.finalScore = args.finalScore
    }

    await ctx.db.patch(args.runId, patch)
  },
})

export const createSession = mutation({
  args: {
    runId: v.id("runs"),
    externalSessionId: v.string(),
    status: v.union(
      v.literal("creating"),
      v.literal("active"),
      v.literal("closed"),
      v.literal("failed"),
    ),
    replayUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()

    return await ctx.db.insert("sessions", {
      runId: args.runId,
      provider: "steel",
      externalSessionId: args.externalSessionId,
      status: args.status,
      replayUrl: args.replayUrl,
      startedAt: now,
      updatedAt: now,
    })
  },
})

export const updateSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    status: v.optional(
      v.union(
        v.literal("creating"),
        v.literal("active"),
        v.literal("closed"),
        v.literal("failed"),
      ),
    ),
    replayUrl: v.optional(v.string()),
    finishedAt: v.optional(v.union(v.number(), v.null())),
  },
  handler: async (ctx, args) => {
    const patch: {
      finishedAt?: number | undefined
      replayUrl?: string
      status?: "active" | "closed" | "creating" | "failed"
      updatedAt: number
    } = {
      updatedAt: Date.now(),
    }

    if (args.status !== undefined) {
      patch.status = args.status
    }

    if (args.replayUrl !== undefined) {
      patch.replayUrl = args.replayUrl
    }

    if (args.finishedAt !== undefined) {
      patch.finishedAt = args.finishedAt ?? undefined
    }

    await ctx.db.patch(args.sessionId, patch)
  },
})

export const generateArtifactUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl()
  },
})

export const createArtifact = mutation({
  args: {
    runId: v.id("runs"),
    type: v.union(
      v.literal("screenshot"),
      v.literal("trace"),
      v.literal("html-report"),
      v.literal("replay"),
    ),
    fileLocation: v.string(),
    storageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("artifacts", {
      runId: args.runId,
      type: args.type,
      fileLocation: args.fileLocation,
      storageId: args.storageId,
      createdAt: Date.now(),
    })
  },
})

export const getRunReport = query({
  args: {
    runId: v.id("runs"),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId)

    if (!run) {
      return null
    }

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_run_and_started_at", (q) => q.eq("runId", args.runId))
      .order("desc")
      .first()

    const artifacts = await ctx.db
      .query("artifacts")
      .withIndex("by_run_and_created_at", (q) => q.eq("runId", args.runId))
      .order("desc")
      .collect()

    const artifactsWithUrls = await Promise.all(
      artifacts.map(async (artifact) => ({
        ...artifact,
        url: artifact.storageId
          ? await ctx.storage.getUrl(artifact.storageId)
          : undefined,
      })),
    )

    return {
      run,
      session,
      artifacts: artifactsWithUrls,
    }
  },
})
