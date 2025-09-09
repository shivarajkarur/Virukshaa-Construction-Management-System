"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts"

const data = [
  { item: "Cement", current: 1200, reorder: 200 },
  { item: "Steel", current: 50, reorder: 100 },
  { item: "Bricks", current: 25000, reorder: 5000 },
  { item: "Concrete", current: 80, reorder: 150 },
  { item: "Sand", current: 200, reorder: 50 },
]

const chartConfig = {
  current: {
    label: "Current Stock",
    color: "hsl(var(--chart-1))",
  },
  reorder: {
    label: "Reorder Level",
    color: "hsl(var(--chart-2))",
  },
}

export default function InventoryChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Levels</CardTitle>
        <CardDescription>Current stock vs reorder levels</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <XAxis dataKey="item" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="current" fill="var(--color-current)" />
              <Bar dataKey="reorder" fill="var(--color-reorder)" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
