"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Download } from "lucide-react"; // Icon for the button
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// --- Constants ---
const DEFECT_TYPES = [
  "Fitment / Functional Defect",
  "Handling Defect",
  "Aesthetic Defect",
];
const SOURCES = ["Internal Defects", "Customer Complaints", "Firewall Defects"];
const SKILL_LEVELS = ["Leve-01", "Leve-02", "Leve-03", "Leve-04"];
const UNITS = ["PUNE 1", "PUNE 2", "PUNE 3", "PUNE 4"];

export default function DailyDefectsPage() {
  // --- State for Data Table ---
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  // --- Filters State ---
  const [filterUnit, setFilterUnit] = useState("all");
  const [filterSkill, setFilterSkill] = useState("all");

  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: new Date(),
  });

  // --- Form Hook ---
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      defect_type: "",
      defect_source: "",
      skill_level: "",
      unit: "",
      gp_no: "",
      employee_name: "",
    },
  });

  const gpNo = watch("gp_no");
  const employeeName = watch("employee_name");

  // --- 1. Fetch Data Function ---
  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "10",
      unit: filterUnit,
      skill: filterSkill,
    });

    const res = await fetch(`/api/defects?${params}`); // API Call
    const json = await res.json();

    setDefects(json.data);
    setTotalPages(json.totalPages);
    setLoading(false);
  };

  // Trigger fetch on mount or when page/filters change
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterUnit, filterSkill]);

  // --- 2. Auto-Fetch Employee Name ---
  useEffect(() => {
    const fetchEmpName = async () => {
      if (gpNo && gpNo.length > 2) {
        try {
          const res = await fetch(`/api/defects?gp_no=${gpNo}`);
          const data = await res.json();

          if (data.success) {
            setValue("employee_name", data.name);
          } else {
            setValue("employee_name", "");
          }
        } catch (error) {
          console.error("Error fetching employee:", error);
        }
      } else {
        setValue("employee_name", "");
      }
    };

    const timer = setTimeout(fetchEmpName, 500);
    return () => clearTimeout(timer);
  }, [gpNo, setValue]);

  // --- 3. Form Submission ---
  const onSubmit = async (data) => {
    if (!data.employee_name) {
      toast.error("Invalid Employee GP Number. Cannot verify employee.");
      return;
    }

    try {
      const response = await fetch("/api/defects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const res = await response.json();

      if (res.success) {
        toast.success("Defect entry saved!");
        reset();
        setValue("date", format(new Date(), "yyyy-MM-dd"));
        fetchData(); // Refresh the table
      } else {
        toast.error(res.message || "Failed to save.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while saving.");
    }
  };

  const handleExport = () => {
    // Build the query string based on current filters and date range
    const params = new URLSearchParams();

    if (filterUnit !== "all") params.append("unit", filterUnit);
    if (filterSkill !== "all") params.append("skill", filterSkill);

    // Check if user selected a date range
    if (dateRange?.from) {
      params.append("startDate", format(dateRange.from, "yyyy-MM-dd"));
      params.append(
        "endDate",
        format(dateRange.to || dateRange.from, "yyyy-MM-dd")
      );
    }

    // Trigger Download
    window.location.href = `/api/defects/export?${params.toString()}`;
    toast.success("Export started...");
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Daily Defects Management</h1>
          <p className="text-slate-500">
            Manage daily defects.
          </p>
        </div>
      </div>

      {/* --- FORM SECTION --- */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Defect Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {/* Date */}
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" {...register("date", { required: true })} />
            </div>

            {/* Unit */}
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select onValueChange={(val) => setValue("unit", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Unit" />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Skill Level */}
            <div className="space-y-2">
              <Label>Skill Level</Label>
              <Select onValueChange={(val) => setValue("skill_level", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Level" />
                </SelectTrigger>
                <SelectContent>
                  {SKILL_LEVELS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Defect Type */}
            <div className="space-y-2">
              <Label>Defect Type</Label>
              <Select onValueChange={(val) => setValue("defect_type", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  {DEFECT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Source of Defect */}
            <div className="space-y-2">
              <Label>Source</Label>
              <Select onValueChange={(val) => setValue("defect_source", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Source" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* GP Number & Auto Name */}
            <div className="space-y-2">
              <Label>Employee GP No</Label>
              <Input
                {...register("gp_no", { required: true })}
                placeholder="Enter GP No"
              />
            </div>

            <div className="space-y-2">
              <Label>Employee Name</Label>
              <Input
                {...register("employee_name", { required: true })}
                placeholder="Auto-filled..."
                readOnly
                className="bg-gray-100"
              />
              {!employeeName && gpNo && gpNo.length > 2 && (
                <span className="text-xs text-red-500">
                  Searching... or Not Found
                </span>
              )}
            </div>

            {/* Submit Button */}
            <div className="md:col-span-2 lg:col-span-3 pt-4">
              <Button
                type="submit"
                className="w-full md:w-auto"
                disabled={!employeeName}
              >
                Save Entry
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* --- TABLE SECTION --- */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <CardTitle>Defect Entries Log</CardTitle>

            {/* Filters */}
            <div className="flex gap-2">
              <Select value={filterUnit} onValueChange={setFilterUnit}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Units</SelectItem>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterSkill} onValueChange={setFilterSkill}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter Skill" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {SKILL_LEVELS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 border-l pl-2 ml-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-60 justify-start text-left font-normal"
                    >
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>

                <Button
                  onClick={handleExport}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Excel
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>GP No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Defect Type</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Skill Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : defects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">
                    No records found.
                  </TableCell>
                </TableRow>
              ) : (
                defects.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      {format(new Date(d.defect_date), "dd-MMM-yyyy")}
                    </TableCell>
                    <TableCell>{d.gp_no}</TableCell>
                    <TableCell className="font-medium">
                      {d.employee_name}
                    </TableCell>
                    <TableCell>{d.unit}</TableCell>
                    <TableCell>{d.defect_type}</TableCell>
                    <TableCell>{d.defect_source}</TableCell>
                    <TableCell>{d.skill_level}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex justify-end items-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
