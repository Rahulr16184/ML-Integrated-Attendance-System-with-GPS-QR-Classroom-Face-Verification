"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart as RechartsBarChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface InstitutionStatsChartProps {
  chartConfig: ChartConfig;
  chartData: {
    role: string;
    count: number;
    fill: string;
  }[];
}

export function InstitutionStatsChart({
  chartConfig,
  chartData,
}: InstitutionStatsChartProps) {
  return (
    <ChartContainer config={chartConfig} className="w-full h-[200px]">
      <RechartsBarChart
        data={chartData}
        layout="vertical"
        margin={{ left: 10 }}
      >
        <CartesianGrid horizontal={false} />
        <YAxis
          dataKey="role"
          type="category"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          width={80}
        />
        <XAxis type="number" hide />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey="count" radius={5} />
      </RechartsBarChart>
    </ChartContainer>
  );
}
