import { chromium } from "playwright"
import SteelClient from "steel-sdk"
import { NonRetriableError } from "inngest"
import type { Id } from "../convex/_generated/dataModel"
import { api } from "../convex/_generated/api"
import { createConvexServerClient } from "~/server/convex"
import { serverEnv } from "~/server-env"
import { inngest } from "./core"
import { isTransientWorkflowError } from "@/lib/workflow-errors"

type RunRequestedEvent = {
  data: {
    runId: Id<"runs">
    url: string
  }
}

const steel = new SteelClient({
  steelAPIKey: serverEnv.STEEL_API_KEY,
})

export const smokeRun = inngest.createFunction(
  {
    id: "smoke-run",
    retries: 2,
    triggers: [{ event: "app/run.requested" }],
    onFailure: async ({ event, error }) => {
      const convex = createConvexServerClient()
      const failedEvent = event as unknown as RunRequestedEvent

      await convex.mutation(api.runtime.updateRun, {
        runId: failedEvent.data.runId,
        status: "failed",
        currentStep: "Smoke run failed",
        errorMessage: error.message,
        finishedAt: Date.now(),
      })
    },
  },
  async ({ event }: { event: RunRequestedEvent }) => {
    const convex = createConvexServerClient()
    const { runId, url } = event.data

    let browser: Awaited<ReturnType<typeof chromium.connectOverCDP>> | null = null
    let currentSessionId: string | null = null
    let sessionDocId: Id<"sessions"> | null = null
    let workflowError: Error | null = null

    try {
      await convex.mutation(api.runtime.updateRun, {
        runId,
        status: "starting",
        currentStep: "Creating Steel session",
        errorMessage: null,
      })

      const steelSession = await steel.sessions.create()
      currentSessionId = steelSession.id
      sessionDocId = await convex.mutation(api.runtime.createSession, {
        runId,
        externalSessionId: steelSession.id,
        status: "creating",
        replayUrl: steelSession.sessionViewerUrl,
      })

      await convex.mutation(api.runtime.updateRun, {
        runId,
        status: "running",
        currentStep: "Connecting Playwright to Steel",
      })

      browser = await chromium.connectOverCDP(
        `wss://connect.steel.dev?apiKey=${serverEnv.STEEL_API_KEY}&sessionId=${steelSession.id}`,
      )

      await convex.mutation(api.runtime.updateSession, {
        sessionId: sessionDocId,
        status: "active",
        replayUrl: steelSession.sessionViewerUrl,
      })

      const context = browser.contexts()[0] ?? (await browser.newContext())
      const page = context.pages()[0] ?? (await context.newPage())

      await convex.mutation(api.runtime.updateRun, {
        runId,
        status: "running",
        currentStep: "Navigating target page",
      })

      await page.goto(url, {
        waitUntil: "networkidle",
        timeout: 30_000,
      })

      await convex.mutation(api.runtime.updateRun, {
        runId,
        status: "running",
        currentStep: "Capturing screenshot",
      })

      const screenshot = await page.screenshot({
        fullPage: true,
        type: "png",
      })

      const uploadUrl = await convex.mutation(api.runtime.generateArtifactUploadUrl, {})
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": "image/png",
        },
        body: new Uint8Array(screenshot),
      })

      if (!uploadResponse.ok) {
        throw new Error(`Convex upload failed with status ${uploadResponse.status}`)
      }

      const { storageId } = (await uploadResponse.json()) as {
        storageId: Id<"_storage">
      }

      await convex.mutation(api.runtime.createArtifact, {
        runId,
        type: "screenshot",
        fileLocation: `convex-storage:${storageId}`,
        storageId,
      })

      await convex.mutation(api.runtime.updateRun, {
        runId,
        status: "completed",
        currentStep: "Smoke run completed",
        finishedAt: Date.now(),
        errorMessage: null,
      })
    } catch (error) {
      workflowError = error instanceof Error ? error : new Error("Unknown smoke run error")

      if (!isTransientWorkflowError(error)) {
        await convex.mutation(api.runtime.updateRun, {
          runId,
          status: "failed",
          currentStep: "Smoke run failed",
          errorMessage: workflowError.message,
          finishedAt: Date.now(),
        })

        throw new NonRetriableError(workflowError.message)
      }

      await convex.mutation(api.runtime.updateRun, {
        runId,
        status: "running",
        currentStep: "Transient browser failure, retrying",
        errorMessage: workflowError.message,
      })

      throw workflowError
    } finally {
      if (browser) {
        await browser.close().catch(() => undefined)
      }

      if (currentSessionId) {
        await steel.sessions.release(currentSessionId).catch(() => undefined)
      }

      if (sessionDocId) {
        await convex
          .mutation(api.runtime.updateSession, {
            sessionId: sessionDocId,
            status: workflowError ? "failed" : "closed",
            finishedAt: Date.now(),
          })
          .catch(() => undefined)
      }
    }
  },
)
