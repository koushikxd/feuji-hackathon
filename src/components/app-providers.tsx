"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ConvexQueryClient } from "@convex-dev/react-query"
import { ConvexProvider, ConvexReactClient } from "convex/react"
import { useState } from "react"
import { env } from "~/env"

function createClients() {
  const convex = new ConvexReactClient(env.VITE_CONVEX_URL)
  const convexQueryClient = new ConvexQueryClient(convex)
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Number.POSITIVE_INFINITY,
        gcTime: 10_000,
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
      },
    },
  })

  convexQueryClient.connect(queryClient)

  return { convex, queryClient }
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [{ convex, queryClient }] = useState(createClients)

  return (
    <ConvexProvider client={convex}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ConvexProvider>
  )
}
