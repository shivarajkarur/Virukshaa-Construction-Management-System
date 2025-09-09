"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts"

const data = [
  { month: "Jan", completed: 4, ongoing: 8, planned: 3 },
  { month: "Feb", completed: 6, ongoing: 10, planned: 5 },
  { month: "Mar", completed: 8, ongoing: 12, planned: 4 },
  { month: "Apr", completed: 5, ongoing: 15, planned: 6 },
  { month: "May", completed: 9, ongoing: 11, planned: 7 },
  { month: "Jun", completed: 7, ongoing: 13, planned: 5 },
]

const chartConfig = {
  completed: {
    label: "Completed",
    color: "hsl(var(--chart-1))",
  },
  ongoing: {
    label: "Ongoing",
    color: "hsl(var(--chart-2))",
  },
  planned: {
    label: "Planned",
    color: "hsl(var(--chart-3))",
  },
}

export default function ProjectChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Overview</CardTitle>
        <CardDescription>Monthly project status breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ChartContainer config={chartConfig}>
            <BarChart
              width={800}  // This will be constrained by the parent div
              height={300}
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <XAxis dataKey="month" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="completed" fill="var(--color-completed)" />
              <Bar dataKey="ongoing" fill="var(--color-ongoing)" />
              <Bar dataKey="planned" fill="var(--color-planned)" />
            </BarChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}
