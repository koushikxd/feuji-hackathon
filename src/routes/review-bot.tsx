import { createFileRoute } from "@tanstack/react-router"
import { IconMessage2Bolt } from "@tabler/icons-react"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export const Route = createFileRoute("/review-bot")({
  component: ReviewBotPage,
})

function ReviewBotPage() {
  return (
    <Empty className="min-h-[calc(100svh-12rem)] border border-dashed border-border/70 bg-card/60">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconMessage2Bolt />
        </EmptyMedia>
        <EmptyTitle>Review Bot is reserved for the PR workflow.</EmptyTitle>
        <EmptyDescription>
          This placeholder remains empty until the PR review pipeline is wired.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
