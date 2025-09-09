"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts"

const data = [
  { month: "Jan", cement: 1200, steel: 800, bricks: 15000 },
  { month: "Feb", cement: 1500, steel: 1200, bricks: 18000 },
  { month: "Mar", cement: 1800, steel: 1500, bricks: 22000 },
  { month: "Apr", cement: 1400, steel: 1100, bricks: 19000 },
  { month: "May", cement: 2000, steel: 1800, bricks: 25000 },
  { month: "Jun", cement: 1700, steel: 1400, bricks: 21000 },
]

const chartConfig = {
  cement: {
    label: "Cement (bags)",
    color: "hsl(var(--chart-1))",
  },
  steel: {
    label: "Steel (tons)",
    color: "hsl(var(--chart-2))",
  },
  bricks: {
    label: "Bricks (units)",
    color: "hsl(var(--chart-3))",
  },
}

export default function MaterialChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Material Usage Trends</CardTitle>
        <CardDescription>Monthly material consumption patterns</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ChartContainer config={chartConfig}>
            <LineChart
              width={800}
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
              <Line type="monotone" dataKey="cement" stroke="var(--color-cement)" strokeWidth={2} />
              <Line type="monotone" dataKey="steel" stroke="var(--color-steel)" strokeWidth={2} />
              <Line type="monotone" dataKey="bricks" stroke="var(--color-bricks)" strokeWidth={2} />
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}
