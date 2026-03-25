import { createFileRoute } from "@tanstack/react-router"
import { useConvexMutation } from "@convex-dev/react-query"
import { useMutation } from "@tanstack/react-query"
import { IconArrowRight, IconWorldWww } from "@tabler/icons-react"
import { useMemo, useState } from "react"
import { api } from "../../convex/_generated/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  PromptInput,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input"

export const Route = createFileRoute("/")({ component: App })

function App() {
  const navigate = Route.useNavigate()
  const [url, setUrl] = useState("")
  const [error, setError] = useState<string | null>(null)
  const createRunMutation = useConvexMutation(api.runs.createRun)
  const { mutateAsync, isPending } = useMutation({
    mutationFn: createRunMutation,
  })

  const normalizedUrl = useMemo(() => url.trim(), [url])

  const handleSubmit = async () => {
    const validatedUrl = validateRunUrl(normalizedUrl)
    if (!validatedUrl) {
      setError("Enter a full URL starting with http:// or https://.")
      return
    }

    setError(null)

    const runId = await mutateAsync({ url: validatedUrl })
    void navigate({ to: "/runs/$runId", params: { runId } })
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <Card className="border border-border/70 bg-card/80">
        <CardHeader className="gap-4 border-b border-border/70">
          <Badge variant="outline" className="w-fit tracking-[0.18em] uppercase">
            Run Creation
          </Badge>
          <div className="space-y-3">
            <CardTitle className="max-w-2xl text-3xl leading-tight">
              Launch the first browser QA run from a single URL.
            </CardTitle>
            <CardDescription className="max-w-2xl text-sm/6">
              The home screen acts like an operator console: enter a public app
              URL, create the run record in Convex, and jump straight into the
              live status view.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <PromptInput
            value={url}
            onValueChange={(value) => {
              setUrl(value)
              if (error) {
                setError(null)
              }
            }}
            onSubmit={() => {
              void handleSubmit()
            }}
            isLoading={isPending}
            className="bg-background/70 p-3 shadow-none"
          >
            <div className="flex items-start gap-3">
              <div className="mt-2 flex size-10 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-muted/70 text-muted-foreground">
                <IconWorldWww className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <PromptInputTextarea
                  placeholder="https://example.com"
                  className="min-h-[56px] py-3 text-base"
                  aria-label="Run URL"
                />
              </div>
            </div>
            <PromptInputActions className="mt-3 justify-between">
              <p className="text-sm text-muted-foreground">
                Enter submits. Only absolute HTTP(S) URLs are accepted.
              </p>
              <Button
                onClick={() => {
                  void handleSubmit()
                }}
                disabled={isPending}
                className="min-w-32 rounded-2xl"
              >
                {isPending ? "Creating..." : "Run Agent"}
                <IconArrowRight className="size-4" />
              </Button>
            </PromptInputActions>
          </PromptInput>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border border-border/70 bg-card/80">
        <CardHeader className="gap-4 border-b border-border/70">
          <CardTitle className="text-lg">What this proves</CardTitle>
          <CardDescription>
            This is the first visible product loop, intentionally small and
            operational.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6 text-sm text-muted-foreground">
          <FeatureLine
            title="Convex-backed creation"
            body="Submitting the form persists a queued run record immediately."
          />
          <FeatureLine
            title="Dedicated live route"
            body="Each new run redirects to its own status screen at `/runs/$runId`."
          />
          <FeatureLine
            title="Ready for orchestration"
            body="The status page is already shaped to accept future step, findings, and artifact updates."
          />
        </CardContent>
      </Card>
    </div>
  )
}

function FeatureLine({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <p className="mt-1 leading-6">{body}</p>
    </div>
  )
}

function validateRunUrl(value: string) {
  if (!value) {
    return null
  }

  try {
    const parsed = new URL(value)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null
    }
    return parsed.toString()
  } catch {
    return null
  }
}
