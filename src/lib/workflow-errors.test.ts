import { describe, expect, it } from "vitest"
import { isTransientWorkflowError } from "./workflow-errors"

describe("isTransientWorkflowError", () => {
  it("returns true for transient network and timeout failures", () => {
    expect(isTransientWorkflowError({ name: "TimeoutError" })).toBe(true)
    expect(isTransientWorkflowError({ status: 429 })).toBe(true)
    expect(isTransientWorkflowError({ statusCode: 503 })).toBe(true)
  })

  it("returns false for terminal failures", () => {
    expect(isTransientWorkflowError(new Error("bad url"))).toBe(false)
    expect(isTransientWorkflowError({ name: "AuthenticationError", status: 401 })).toBe(false)
  })
})
