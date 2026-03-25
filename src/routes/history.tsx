import { createFileRoute } from "@tanstack/react-router"
import { IconTimeline } from "@tabler/icons-react"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export const Route = createFileRoute("/history")({
  component: HistoryPage,
})

function HistoryPage() {
  return (
    <Empty className="min-h-[calc(100svh-12rem)] border border-dashed border-border/70 bg-card/60">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconTimeline />
        </EmptyMedia>
        <EmptyTitle>Run history will collect here.</EmptyTitle>
        <EmptyDescription>
          The page is intentionally blank until real completed runs and reports
          exist to browse.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
