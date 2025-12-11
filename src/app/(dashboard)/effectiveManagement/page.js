"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  joinedVsTrainedConfig,
  planVsActualConfig,
  defectsConfig,
  ctqConfig,
} from "@/lib/graphConfig";

const DashboardPage = () => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const trainingData = [
    { month: "Jan", joined: 186, trained: 80, plan: 200, actual: 186 },
    { month: "Feb", joined: 305, trained: 200, plan: 310, actual: 305 },
    { month: "Mar", joined: 237, trained: 120, plan: 250, actual: 237 },
    { month: "Apr", joined: 73, trained: 190, plan: 100, actual: 73 },
    { month: "May", joined: 209, trained: 130, plan: 210, actual: 209 },
    { month: "Jun", joined: 214, trained: 140, plan: 220, actual: 214 },
  ];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const defectsData = [
    { month: "Jan", totalDefects: 186, ctqRejection: 45 },
    { month: "Feb", totalDefects: 305, ctqRejection: 82 },
    { month: "Mar", totalDefects: 237, ctqRejection: 60 },
    { month: "Apr", totalDefects: 73, ctqRejection: 20 },
    { month: "May", totalDefects: 209, ctqRejection: 55 },
    { month: "Jun", totalDefects: 214, ctqRejection: 65 },
  ];

  const summary = useMemo(() => {
    return {
      joined: trainingData.reduce((acc, curr) => acc + curr.joined, 0),
      trained: trainingData.reduce((acc, curr) => acc + curr.trained, 0),
      plan: trainingData.reduce((acc, curr) => acc + curr.plan, 0),
      actual: trainingData.reduce((acc, curr) => acc + curr.actual, 0),
      defects: defectsData.reduce((acc, curr) => acc + curr.totalDefects, 0),
      ctq: defectsData.reduce((acc, curr) => acc + curr.ctqRejection, 0),
    };
  }, [trainingData, defectsData]);

  return (
    <div className="w-full min-h-screen p-4 bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-4">
        {/* ---------- LEFT SIDEBAR SUMMARY ---------- */}
        <div className="space-y-4">
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-center text-sm font-bold text-gray-700 dark:text-gray-200">
                Training Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <SummaryBox label="Operators Joined" value={summary.joined} />
              <SummaryBox label="Operators Trained" value={summary.trained} />
              <SummaryBox label="Total Plan" value={summary.plan} />
              <SummaryBox label="Total Actual" value={summary.actual} />
            </CardContent>
          </Card>

          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-center text-sm font-bold text-gray-700 dark:text-gray-200">
                Man Related Defects
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <SummaryBox label="Total Defects" value={summary.defects} />
              <SummaryBox label="CTQ Rejections" value={summary.ctq} />
            </CardContent>
          </Card>
        </div>

        {/* ---------- RIGHT MAIN GRID (CHARTS) ---------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Chart 1: Joined vs Trained */}
          <Card className="h-[400px] dark:bg-slate-900 dark:border-slate-800 flex flex-col">
            <CardHeader>
              <CardTitle>Operator Trainings - Joined Vs Trained</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              <ChartContainer
                config={joinedVsTrainedConfig}
                className="h-full w-full"
              >
                <BarChart accessibilityLayer data={trainingData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dashed" />}
                  />
                  <Bar dataKey="joined" fill="var(--color-joined)" radius={4} />
                  <Bar
                    dataKey="trained"
                    fill="var(--color-trained)"
                    radius={4}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Chart 2: Plan vs Actual */}
          <Card className="h-[400px] dark:bg-slate-900 dark:border-slate-800 flex flex-col">
            <CardHeader>
              <CardTitle>Training Plan Vs Actual</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              <ChartContainer
                config={planVsActualConfig}
                className="h-full w-full"
              >
                <AreaChart accessibilityLayer data={trainingData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Area
                    dataKey="plan"
                    type="natural"
                    fill="var(--color-plan)"
                    fillOpacity={0.4}
                    stroke="var(--color-plan)"
                    stackId="a"
                  />
                  <Area
                    dataKey="actual"
                    type="natural"
                    fill="var(--color-actual)"
                    fillOpacity={0.4}
                    stroke="var(--color-actual)"
                    stackId="a"
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Chart 3: Defects Trend */}
          <Card className="h-[400px] dark:bg-slate-900 dark:border-slate-800 flex flex-col">
            <CardHeader>
              <CardTitle>Man Related Defects Trend</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              <ChartContainer config={defectsConfig} className="h-full w-full">
                <AreaChart accessibilityLayer data={defectsData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Area
                    dataKey="totalDefects"
                    type="monotone"
                    fill="var(--color-totalDefects)"
                    fillOpacity={0.2}
                    stroke="var(--color-totalDefects)"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Chart 4: CTQ Rejection */}
          <Card className="h-[400px] dark:bg-slate-900 dark:border-slate-800 flex flex-col">
            <CardHeader>
              <CardTitle>Internal Rejection at CTQ</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
              <ChartContainer config={ctqConfig} className="h-full w-full">
                <AreaChart accessibilityLayer data={defectsData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Area
                    dataKey="ctqRejection"
                    type="monotone"
                    fill="var(--color-ctqRejection)"
                    fillOpacity={0.4}
                    stroke="var(--color-ctqRejection)"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const SummaryBox = ({ label, value }) => (
  <div className="bg-white dark:bg-slate-950 rounded-lg shadow-sm p-6 flex flex-col justify-between items-center border border-gray-100 dark:border-slate-800">
    <span className="text-xs text-center text-gray-500 dark:text-gray-400 font-medium">
      {label}
    </span>
    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
      {value}
    </span>
  </div>
);

export default DashboardPage;
