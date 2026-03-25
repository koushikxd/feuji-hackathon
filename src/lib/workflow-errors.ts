type WorkflowLikeError = {
  name?: string
  status?: number
  statusCode?: number
}

const transientNames = new Set([
  "APIConnectionError",
  "APIConnectionTimeoutError",
  "InternalServerError",
  "RateLimitError",
  "RetryAfterError",
  "TimeoutError",
])

export function isTransientWorkflowError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false
  }

  const workflowError = error as WorkflowLikeError
  const status = workflowError.status ?? workflowError.statusCode

  if (typeof status === "number") {
    return status === 408 || status === 409 || status === 429 || status >= 500
  }

  return workflowError.name ? transientNames.has(workflowError.name) : false
}
