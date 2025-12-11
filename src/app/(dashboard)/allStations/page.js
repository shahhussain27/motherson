"use client";
import React, { useState, useEffect, useMemo } from "react";
import { format } from "date-fns"; 
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bar,
  BarChart,
  Area,
  AreaChart,
  Pie,
  PieChart,
  CartesianGrid,
  XAxis,
  LabelList,
  Label,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import { ChevronDownIcon, CalendarIcon } from "lucide-react";
import {
  MANPOWER_TREND_Config,
  EMPLOYEEMENT_TYPES_Config,
  ATTRITION_RATE_TREND_CONFIG,
  BUFFER_MANPOWER_AVAILABILITY_TREND_CONFIG,
  ABABSENDTEISM_RATE_TREND_CONFIG,
  EMPLOYEEMENT_TYPES,
} from "@/lib/graphConfig";
import { cn } from "@/lib/utils";

export default function Page() {
  const [open, setOpen] = useState(false);
  
  // 1. Define Filter States
  const [date, setDate] = useState({
    from: new Date(2025, 8, 26), // Default Start
    to: new Date(2025, 10, 25),  // Default End
  });
  const [unit, setUnit] = useState("ALL");
  const [skill, setSkill] = useState("ALL");
  const [empType, setEmpType] = useState("ALL");

  const [analyticsData, setAnalyticsData] = useState(null);

  const totalVisitors = useMemo(() => {
    if (!analyticsData?.pieData) return 0;
    return analyticsData.pieData.reduce((acc, curr) => acc + curr.available, 0);
  }, [analyticsData]);

  const fetchData = async () => {
    // 2. Format Dates safely
    const startStr = date?.from ? format(date.from, "yyyy-MM-dd") : "";
    const endStr = date?.to ? format(date.to, "yyyy-MM-dd") : "";

    // 3. Build Dynamic Query
    const query = new URLSearchParams({
      startDate: startStr,
      endDate: endStr,
      unit: unit,
      skill: skill,
      type: empType, 
      periodicity: "month", 
    }).toString();

    try {
      const res = await fetch(`/api/manpower-analytics?${query}`);
      const data = await res.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    }
  };

  // 4. Trigger fetch when any filter changes
  useEffect(() => {
    fetchData();
  }, [date, unit, skill, empType]);

  return (
    <div className="w-full min-h-screen">
      {/* Filters-column layout */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <h2 className="font-semibold">Filters</h2>
        
        {/* DATE RANGE PICKER */}
        <div className="flex flex-col gap-3">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                id="date"
                className={cn(
                  "w-[260px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} -{" "}
                      {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* UNIT FILTER */}
        <div>
          <Select value={unit} onValueChange={setUnit}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Units</SelectLabel>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="PUNE1">Pune 1</SelectItem>
                <SelectItem value="PUNE2">Pune 2</SelectItem>
                <SelectItem value="PUNE3">Pune 3</SelectItem>
                <SelectItem value="PUNE4">Pune 4</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* SKILL FILTER */}
        <div>
          <Select value={skill} onValueChange={setSkill}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a skill level" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Level</SelectLabel>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="LEVEL-01">Skill Level 1</SelectItem>
                <SelectItem value="LEVEL-02">Skill Level 2</SelectItem>
                <SelectItem value="LEVEL-03">Skill Level 3</SelectItem>
                <SelectItem value="LEVEL-04">Skill Level 4</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* EMPLOYMENT TYPE FILTER */}
        <div>
          <Select value={empType} onValueChange={setEmpType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Type</SelectLabel>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="Permanent">Permanent</SelectItem>
                <SelectItem value="Temporary">Temporary</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 3-column layout */}
      <div className="grid lg:grid-cols-3 gap-2 h-full">
        {/* LEFT MAIN AREA (2 columns) */}
        <div className="col-span-2 flex flex-col gap-2">
          {/* TOP CARDS */}
          <div className="grid lg:grid-cols-5 gap-2">
            {analyticsData?.cards?.map((card, i) => (
              <Card key={i} className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-3xl font-bold text-center">
                    {card.value}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-center text-nowrap text-gray-500">
                  {card.title}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* MIDDLE BIG GRAPHS */}
          <div className="grid lg:grid-cols-2 gap-2 flex-1">
            <Card className="shadow-sm h-full">
              <CardHeader>
                <CardTitle className="text-center">
                  Manpower Availability Trend
                </CardTitle>
              </CardHeader>
              <ChartContainer
                config={MANPOWER_TREND_Config}
                className="min-h-[200px] w-full"
              >
                <BarChart accessibilityLayer data={analyticsData?.manpowerTrend}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                    dataKey="required"
                    fill="var(--color-required)"
                    radius={4}
                  >
                    {" "}
                    <LabelList
                      position="top"
                      offset={12}
                      className="fill-foreground"
                      fontSize={8}
                    />{" "}
                  </Bar>
                  <Bar
                    dataKey="available"
                    fill="var(--color-available)"
                    radius={4}
                  >
                    {" "}
                    <LabelList
                      position="top"
                      offset={12}
                      className="fill-foreground"
                      fontSize={8}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            </Card>
            <Card className="shadow-sm h-full">
              <CardHeader>
                <CardTitle className="text-center">
                  Attrition Rate Trend
                </CardTitle>
              </CardHeader>
              <ChartContainer config={ATTRITION_RATE_TREND_CONFIG}>
                <AreaChart
                  accessibilityLayer
                  data={analyticsData?.attritionTrend}
                  margin={{
                    left: 12,
                    right: 12,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Area
                    dataKey="rate"
                    type="natural"
                    fill="var(--color-rate)"
                    fillOpacity={0.4}
                    stroke="var(--color-rate)"
                  />
                </AreaChart>
              </ChartContainer>
            </Card>
          </div>

          {/* BOTTOM BIG GRAPHS */}
          <div className="grid grid-cols-2 gap-2 flex-1">
            <Card className="shadow-sm h-full">
              <CardHeader>
                <CardTitle className="text-center">
                  Buffer Manpower Availability Trend
                </CardTitle>
              </CardHeader>
              <ChartContainer
                config={BUFFER_MANPOWER_AVAILABILITY_TREND_CONFIG}
              >
                <AreaChart
                  accessibilityLayer
                  data={analyticsData?.bufferTrend}
                  margin={{
                    left: 12,
                    right: 12,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Area
                    dataKey="rate"
                    type="natural"
                    fill="var(--color-rate)"
                    fillOpacity={0.4}
                    stroke="var(--color-rate)"
                  />
                </AreaChart>
              </ChartContainer>
            </Card>
            <Card className="shadow-sm h-full">
              <CardHeader>
                <CardTitle className="text-center">
                  Absenteeism Rate Trend
                </CardTitle>
              </CardHeader>
              <ChartContainer config={ABABSENDTEISM_RATE_TREND_CONFIG}>
                <AreaChart
                  accessibilityLayer
                  data={analyticsData?.absenteeismTrend}
                  margin={{
                    left: 12,
                    right: 12,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Area
                    dataKey="rate"
                    type="natural"
                    fill="var(--color-rate)"
                    fillOpacity={0.4}
                    stroke="var(--color-rate)"
                  />
                </AreaChart>
              </ChartContainer>
            </Card>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="flex flex-col gap-3">
          {analyticsData?.operators?.map((op) => (
            <div key={op.key} className="grid grid-cols-2 gap-3">
              {/* LEFT — REQUIRED */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-3xl font-bold text-center">
                    {op.required}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-center text-gray-500">
                  {op.name} Required
                </CardContent>
              </Card>

              {/* RIGHT — AVAILABLE */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-3xl font-bold text-center">
                    {op.available}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-center text-gray-500">
                  {op.name} Available
                </CardContent>
              </Card>
            </div>
          ))}
          <Card className="flex flex-col">
            <CardHeader className="items-center pb-0">
              <CardTitle>Permanent vs Temporary</CardTitle>
              <CardDescription>
                 {/* Dynamic Date Label */}
                 {/* {date?.from ? format(date.from, "MMM yyyy") : ""} */}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
              <ChartContainer
                config={EMPLOYEEMENT_TYPES_Config}
                className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square max-h-[250px] pb-0"
              >
              {/* {analyticsData?.pieData && ( */}
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />

                  <ChartLegend
                    content={<ChartLegendContent nameKey="browser" />}
                    className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center"
                  />
                  <Pie
                    data={analyticsData?.pieData}
                    dataKey="available"
                    label
                    nameKey="browser"
                    innerRadius={60}
                    strokeWidth={5}
                  >
                    {" "}
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-3xl font-bold"
                              >
                                {totalVisitors.toLocaleString()}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 24}
                                className="fill-muted-foreground"
                              >
                                Employees
                              </tspan>
                            </text>
                          );
                        }
                      }}
                    />
                  </Pie>
                </PieChart>
                {/*  )} */}
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}