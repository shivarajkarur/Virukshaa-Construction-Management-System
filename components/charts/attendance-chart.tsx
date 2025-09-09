"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts"

const data = [
  { day: "Mon", present: 28, absent: 4 },
  { day: "Tue", present: 30, absent: 2 },
  { day: "Wed", present: 26, absent: 6 },
  { day: "Thu", present: 29, absent: 3 },
  { day: "Fri", present: 31, absent: 1 },
  { day: "Sat", present: 25, absent: 7 },
  { day: "Sun", present: 20, absent: 12 },
]

const chartConfig = {
  present: {
    label: "Present",
    color: "hsl(var(--chart-1))",
  },
  absent: {
    label: "Absent",
    color: "hsl(var(--chart-2))",
  },
}

export default function AttendanceChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Attendance</CardTitle>
        <CardDescription>Worker attendance tracking for this week</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <XAxis dataKey="day" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="present"
                stackId="1"
                stroke="var(--color-present)"
                fill="var(--color-present)"
              />
              <Area
                type="monotone"
                dataKey="absent"
                stackId="1"
                stroke="var(--color-absent)"
                fill="var(--color-absent)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
