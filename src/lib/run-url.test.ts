import { describe, expect, it } from "vitest"
import { validateRunUrl } from "./run-url"

describe("validateRunUrl", () => {
  it("accepts absolute http and https urls", () => {
    expect(validateRunUrl("https://example.com")).toBe("https://example.com/")
    expect(validateRunUrl("http://example.com/docs")).toBe(
      "http://example.com/docs",
    )
  })

  it("rejects invalid or unsupported urls", () => {
    expect(validateRunUrl("")).toBeNull()
    expect(validateRunUrl("example.com")).toBeNull()
    expect(validateRunUrl("ftp://example.com")).toBeNull()
  })
})
