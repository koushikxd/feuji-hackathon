import { ConvexHttpClient } from "convex/browser"
import { serverEnv } from "~/server-env"

export function createConvexServerClient() {
  return new ConvexHttpClient(serverEnv.VITE_CONVEX_URL)
}
