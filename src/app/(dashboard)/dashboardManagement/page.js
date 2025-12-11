"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Calendar as CalendarIcon,
  Save,
  X,
  Trash,
  Pencil,
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ==========================================
// 1. CONFIGURATION: Central Control Logic
// ==========================================
const TAB_CONFIG = {
  manpower: {
    label: "Manpower Requirement",
    apiEndpoint: "/api/attendance/manpower-requirement",
    // Table Headers
    columns: [
      { key: "total_operators_required", label: "Total Ops" },
      { key: "buffer_manpower_required", label: "Buffer", isHighlight: true },
      { key: "l1_required", label: "L1" },
      { key: "l2_required", label: "L2" },
      { key: "l3_required", label: "L3" },
      { key: "l4_required", label: "L4" },
    ],
    // Form Fields for Edit Modal
    formFields: [
      {
        name: "total_operators_required",
        label: "Total Operators",
        type: "number",
        width: "full",
      },
      {
        name: "buffer_manpower_required",
        label: "Buffer Required",
        type: "number",
        width: "full",
      },
      {
        name: "l1_required",
        label: "L1 Required",
        type: "number",
        width: "half",
      },
      {
        name: "l2_required",
        label: "L2 Required",
        type: "number",
        width: "half",
      },
      {
        name: "l3_required",
        label: "L3 Required",
        type: "number",
        width: "half",
      },
      {
        name: "l4_required",
        label: "L4 Required",
        type: "number",
        width: "half",
      },
    ],
  },
  stations: {
    label: "Stations Requirement",
    apiEndpoint: "/api/attendance/stations-requirement",
    columns: [
      { key: "total_stations_required", label: "Total Stations" },
      {
        key: "total_ctq_stations_required",
        label: "Total CTQ Stations",
        isHighlight: true,
      },
    ],
    formFields: [
      {
        name: "total_stations_required",
        label: "Total Stations Required",
        type: "number",
        width: "full",
      },
      {
        name: "total_ctq_stations_required",
        label: "Total CTQ Stations Required",
        type: "number",
        width: "full",
      },
    ],
  },
  ctq: {
    label: "CTQ Manpower",
    apiEndpoint: "/api/attendance/ctq-manpower-requirement",
    columns: [
      { key: "total_ctq_operators_required", label: "CTQ Ops" },
      { key: "buffer_ctq_required", label: "CTQ Buffer", isHighlight: true },
      // { key: "l1_required", label: "L1" },
      { key: "l2_required", label: "L2" },
      { key: "l3_required", label: "L3" },
      { key: "l4_required", label: "L4" },
    ],
    formFields: [
      {
        name: "total_ctq_operators_required",
        label: "Total CTQ Operators",
        type: "number",
        width: "full",
      },
      {
        name: "buffer_ctq_required",
        label: "CTQ Buffer Required",
        type: "number",
        width: "full",
      },
      // {
      //   name: "l1_required",
      //   label: "L1 Required",
      //   type: "number",
      //   width: "half",
      // },
      {
        name: "l2_required",
        label: "L2 Required",
        type: "number",
        width: "half",
      },
      {
        name: "l3_required",
        label: "L3 Required",
        type: "number",
        width: "half",
      },
      {
        name: "l4_required",
        label: "L4 Required",
        type: "number",
        width: "half",
      },
    ],
  },
};

// ==========================================
// 2. MAIN APP COMPONENT
// ==========================================
const App = () => {
  // State: UI Controls
  const [activeTab, setActiveTab] = useState("manpower");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // State: Data
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // State: Editing
  const [editItem, setEditItem] = useState(null); // Stores the full object being edited

  // State: Upload
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState({ type: "", text: "" });

  // Get current config based on tab
  const currentConfig = TAB_CONFIG[activeTab];

  // --- 1. Fetch Data ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(currentConfig.apiEndpoint);
      if (!res.ok) throw new Error("Failed to fetch");
      const result = await res.json();

      // Standardize date for frontend
      const formatted = result.map((item) => ({
        ...item,
        formattedDate: new Date(item.period_end).toLocaleDateString(),
        rawDate: item.period_end, // Keep raw for form binding if needed
      }));
      setData(formatted);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when tab changes
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // --- 2. Delete Handler ---
  const handleDelete = async (id) => {
    if (!confirm("Are you sure? This will delete this record.")) return;
    try {
      const res = await fetch(`${currentConfig.apiEndpoint}?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setData((prev) => prev.filter((item) => item.id !== id));
      } else {
        alert("Failed to delete");
      }
    } catch (error) {
      console.error("Delete error", error);
    }
  };

  // --- 3. Edit Handler ---
  const openEditModal = (item) => {
    setEditItem(item); // Load item into state
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData(e.target);
      const payload = Object.fromEntries(formData.entries());

      // Ensure ID is included
      payload.id = editItem.id;

      const res = await fetch(currentConfig.apiEndpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Update failed");

      // Optimistic Update or Refresh
      fetchData();
      setIsEditModalOpen(false);
      setEditItem(null);
      alert("Updated Successfully");
    } catch (error) {
      alert("Error updating record");
    }
  };

  // --- 4. Upload Handler ---
  const handleUpload = async () => {
    if (!uploadFile) return;
    setIsUploading(true);
    setUploadMsg({ type: "", text: "" });

    const formData = new FormData();
    formData.append("file", uploadFile);

    try {
      const res = await fetch("/api/attendance/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setUploadMsg({ type: "success", text: "Upload successful!" });
      fetchData(); // Refresh current tab data
      setTimeout(() => setIsUploadModalOpen(false), 1500);
    } catch (error) {
      setUploadMsg({ type: "error", text: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-slate-50 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Production Planning
            </h1>
            <p className="text-slate-500">
              Manage operational requirements and resources.
            </p>
          </div>
          <Button
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-slate-900"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Import Excel Data
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="w-full">
          <div className="inline-flex h-10 items-center justify-center rounded-md bg-white border border-slate-200 p-1 mb-6 shadow-sm">
            {Object.keys(TAB_CONFIG).map((key) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-4 py-1.5 text-sm font-medium transition-all ${
                  activeTab === key
                    ? "bg-slate-100 text-slate-900 font-bold shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {TAB_CONFIG[key].label}
              </button>
            ))}
          </div>

          {/* Dynamic Data Table */}
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {currentConfig.label} Log
              </h2>
              <Button variant="outline" size="sm" onClick={fetchData}>
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />{" "}
                Refresh
              </Button>
            </div>

            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-slate-500 bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="h-12 px-4 font-medium">Date</th>
                      <th className="h-12 px-4 font-medium">Unit</th>
                      {/* Dynamic Headers */}
                      {currentConfig.columns.map((col) => (
                        <th key={col.key} className="h-12 px-4 font-medium">
                          {col.label}
                        </th>
                      ))}
                      <th className="h-12 px-4 font-medium text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.length === 0 && !loading ? (
                      <tr>
                        <td
                          colSpan={currentConfig.columns.length + 3}
                          className="p-8 text-center text-slate-500"
                        >
                          No records found.
                        </td>
                      </tr>
                    ) : (
                      data.map((row) => (
                        <tr
                          key={row.id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="p-4 font-medium">
                            {row.formattedDate}
                          </td>
                          <td className="p-4 text-slate-600">{row.unit}</td>

                          {/* Dynamic Cells */}
                          {currentConfig.columns.map((col) => (
                            <td
                              key={col.key}
                              className={`p-4 ${
                                col.isHighlight
                                  ? "text-emerald-600 font-semibold"
                                  : ""
                              }`}
                            >
                              {/* Add '+' sign if it's a buffer and value > 0 */}
                              {col.isHighlight && row[col.key] > 0 ? "+" : ""}
                              {row[col.key]}
                            </td>
                          ))}

                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditModal(row)}
                                className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {activeTab !== "stations" &&
                                activeTab !== "ctq" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(row.id)}
                                    className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* ==========================================
          3. MODALS
         ========================================== */}

      {/* EDIT MODAL */}
      {isEditModalOpen && editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg border border-slate-200">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold">
                Edit {currentConfig.label}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {/* Read-only Context Info */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-md mb-4 text-sm text-slate-600 border border-slate-100">
                <div>
                  <span className="font-semibold">Unit:</span> {editItem.unit}
                </div>
                <div>
                  <span className="font-semibold">Date:</span>{" "}
                  {editItem.formattedDate}
                </div>
              </div>

              {/* Dynamic Form Fields */}
              <div className="grid grid-cols-2 gap-4">
                {currentConfig.formFields.map((field) => (
                  <div
                    key={field.name}
                    className={`space-y-1.5 ${
                      field.width === "full" ? "col-span-2" : "col-span-1"
                    }`}
                  >
                    <Label
                      htmlFor={field.name}
                      className="text-xs font-medium text-slate-500 uppercase"
                    >
                      {field.label}
                    </Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type={field.type}
                      defaultValue={editItem[field.name]}
                      className="focus-visible:ring-slate-400"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" /> Update
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD MODAL */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Attendance Data</DialogTitle>
            <DialogDescription>
              Upload an Excel file (.xlsx) to bulk import data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select File</Label>
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setUploadFile(e.target.files?.[0])}
              />
            </div>
            {uploadMsg.text && (
              <div
                className={`text-sm p-2 rounded ${
                  uploadMsg.type === "error"
                    ? "bg-red-50 text-red-600"
                    : "bg-emerald-50 text-emerald-600"
                }`}
              >
                {uploadMsg.text}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsUploadModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!uploadFile || isUploading}
              >
                {isUploading ? "Uploading..." : "Upload & Import"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default App;
