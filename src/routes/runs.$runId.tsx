import { createFileRoute } from "@tanstack/react-router"
import { convexQuery } from "@convex-dev/react-query"
import { useQuery } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import type { Id } from "../../convex/_generated/dataModel"
import { api } from "../../convex/_generated/api"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { IconBolt, IconCircleX, IconExternalLink, IconPhoto, IconSearch } from "@tabler/icons-react"

export const Route = createFileRoute("/runs/$runId")({
  component: RunPage,
})

function RunPage() {
  const { runId } = Route.useParams()
  const { data: report } = useQuery(
    convexQuery(api.runtime.getRunReport, { runId: runId as Id<"runs"> })
  )
  const run = report?.run
  const session = report?.session
  const screenshot = report?.artifacts.find((artifact) => artifact.type === "screenshot")

  if (report === null) {
    return (
      <Empty className="min-h-[calc(100svh-12rem)] border border-dashed border-border/70 bg-card/60">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconCircleX />
          </EmptyMedia>
          <EmptyTitle>Run not found.</EmptyTitle>
          <EmptyDescription>
            The requested run id does not exist in Convex yet.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  if (!report || !run) {
    return (
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <Card className="min-h-64 border border-border/70 bg-card/70" />
        <Card className="min-h-64 border border-border/70 bg-card/70" />
      </div>
    )
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
      <Card className="border border-border/70 bg-card/80">
        <CardHeader className="gap-3 border-b border-border/70">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-xl">Live QA run</CardTitle>
              <CardDescription className="max-w-2xl break-all text-sm/6">
                {run.url}
              </CardDescription>
            </div>
            <Badge variant={run.status === "queued" ? "secondary" : "default"}>
              {run.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 pt-4 md:grid-cols-3">
          <Metric
            label="Current Step"
            value={run.currentStep ?? "Waiting for orchestration"}
          />
          <Metric
            label="Browser Session"
            value={session?.status ?? "Not started"}
          />
          <Metric
            label="Started"
            value={formatDistanceToNow(run.startedAt, { addSuffix: true })}
          />
          <Metric
            label="Last Update"
            value={formatDistanceToNow(run.updatedAt, { addSuffix: true })}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <InfoCard
          icon={<IconSearch className="size-4" />}
          title="Runtime status"
          description={
            run.errorMessage ??
            "No findings yet. This milestone only proves the background browser runtime and artifact flow."
          }
          accent={run.errorMessage ? "destructive" : "default"}
        />
        <ArtifactCard
          icon={<IconPhoto className="size-4" />}
          title="Artifacts"
          screenshotUrl={screenshot?.url}
          replayUrl={session?.replayUrl}
        />
      </div>

      <Card className="border border-border/70 bg-card/80 xl:col-span-2">
        <CardHeader className="gap-3 border-b border-border/70">
          <CardTitle className="flex items-center gap-2 text-base">
            <IconBolt className="size-4" />
            Run state
          </CardTitle>
          <CardDescription>
            This first version only confirms the product loop: create a run,
            store it, and watch its live status from Convex.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <dl className="grid gap-3 text-sm md:grid-cols-2">
            <StatusRow label="Status" value={run.status} />
            <StatusRow
              label="Steel replay"
              value={session?.replayUrl ?? "Not available"}
            />
            <StatusRow
              label="Final score"
              value={run.finalScore?.toString() ?? "Not computed"}
            />
            <StatusRow
              label="Finished at"
              value={
                run.finishedAt
                  ? formatDistanceToNow(run.finishedAt, { addSuffix: true })
                  : "Not finished"
              }
            />
            <StatusRow label="Run id" value={run._id} />
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1 rounded-2xl border border-border/70 bg-background/70 p-4">
      <dt className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  )
}

function InfoCard({
  icon,
  title,
  description,
  accent = "default",
}: {
  accent?: "default" | "destructive"
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <Card className="border border-border/70 bg-card/80">
      <CardHeader className="gap-3 border-b border-border/70">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
        <CardDescription
          className={accent === "destructive" ? "text-destructive" : undefined}
        >
          {description}
        </CardDescription>
      </CardHeader>
    </Card>
  )
}

function ArtifactCard({
  icon,
  title,
  screenshotUrl,
  replayUrl,
}: {
  icon: React.ReactNode
  replayUrl?: string
  screenshotUrl?: string | null
  title: string
}) {
  return (
    <Card className="overflow-hidden border border-border/70 bg-card/80">
      <CardHeader className="gap-3 border-b border-border/70">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>
          The smoke run stores the first screenshot in Convex and links the Steel replay when available.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {screenshotUrl ? (
          <img
            alt="Run screenshot"
            src={screenshotUrl}
            className="w-full rounded-2xl border border-border/70 bg-background object-cover"
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
            Screenshot is not available yet.
          </div>
        )}
        {replayUrl ? (
          <a
            href={replayUrl}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({
              variant: "outline",
              className: "w-full justify-between rounded-2xl",
            })}
          >
            Open Steel replay
            <IconExternalLink className="size-4" />
          </a>
        ) : null}
      </CardContent>
    </Card>
  )
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
      <dt className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 break-all text-sm text-foreground">{value}</dd>
    </div>
  )
}
