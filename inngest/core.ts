import { Inngest } from "inngest"
import { serverEnv } from "~/server-env"

export const inngest = new Inngest({
  id: "shard",
  isDev: serverEnv.INNGEST_DEV === "1",
  baseUrl: serverEnv.INNGEST_BASE_URL,
  eventKey: serverEnv.INNGEST_EVENT_KEY,
})
