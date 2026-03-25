import { createFileRoute } from "@tanstack/react-router"
import { IconLayoutDashboard } from "@tabler/icons-react"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <Empty className="min-h-[calc(100svh-12rem)] border border-dashed border-border/70 bg-card/60">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconLayoutDashboard />
        </EmptyMedia>
        <EmptyTitle>Dashboard is waiting on your first real run.</EmptyTitle>
        <EmptyDescription>
          This page stays intentionally empty for now. Once the backend loop is
          in place, it becomes the overview surface.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
