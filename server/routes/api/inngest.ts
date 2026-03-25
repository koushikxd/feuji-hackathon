import { eventHandler } from "nitro/h3"
import { serve } from "inngest/h3"
import { functions, inngest } from "../../../inngest/client"

export default eventHandler(
  serve({
    client: inngest,
    functions,
  }),
)
