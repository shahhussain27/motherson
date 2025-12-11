"use client";

import React, { useState, useEffect } from "react";
import {
  MoreHorizontal,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  ChevronDown,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Import,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { navLinks } from "@/lib/navLinks";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

const ROLES = ["Read", "Write", "Admin"];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const router = useRouter();

  // Form State
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "Read",
    permissions: [],
  });

  // Fetch Users from DB
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      role: "Read",
      permissions: [],
    });
    setEditingUser(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: "",
      role: user.role,
      permissions: user.permissions || [],
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    let newPermissions = [...formData.permissions];
    if (newRole === "Admin") {
      newPermissions = navLinks.map((link) => link.href);
    }
    setFormData({ ...formData, role: newRole, permissions: newPermissions });
  };

  const handleTogglePermission = (href) => {
    if (formData.role === "Admin") return;
    const exists = formData.permissions.includes(href);
    let updatedPermissions;
    if (exists) {
      updatedPermissions = formData.permissions.filter((p) => p !== href);
    } else {
      updatedPermissions = [...formData.permissions, href];
    }
    setFormData({ ...formData, permissions: updatedPermissions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editingUser) {
      // Update User API
      await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, id: editingUser.id }),
      });
    } else {
      // Create User API
      await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
    }

    await fetchUsers(); // Refresh list
    handleCloseModal();
  };

  const handleDelete = async (id) => {
    await fetch(`/api/users?id=${id}`, { method: "DELETE" });
    await fetchUsers(); // Refresh list
    setIsDeleteAlertOpen(false);
    setEditingUser(null);
  };

  // Helper for icons based on role
  const RoleIcon = ({ role }) => {
    if (role === "Admin")
      return <ShieldCheck className="h-4 w-4 mr-2 text-indigo-600" />;
    if (role === "Write")
      return <Pencil className="h-4 w-4 mr-2 text-amber-600" />;
    return <Shield className="h-4 w-4 mr-2 text-slate-500" />;
  };

  if (loading) return <div className="p-8">Loading users...</div>;

  return (
    <div className="min-h-screen bg-white p-8 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div className="flex flex-col space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              User Management
            </h1>
            <p className="text-slate-500">
              Manage user&apos;s requirements and permissions allocation.
            </p>
          </div>
          <Button onClick={handleOpenCreate} className="shadow-lg">
            <Plus className="mr-2 h-4 w-4" /> Create New User
          </Button>
        </div>

        {/* User Table Card */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="h-12 px-6 align-middle font-medium text-slate-500">
                    User
                  </th>
                  <th className="h-12 px-6 align-middle font-medium text-slate-500">
                    Role
                  </th>
                  <th className="h-12 px-6 align-middle font-medium text-slate-500">
                    Permissions
                  </th>
                  <th className="h-12 px-6 align-middle font-medium text-slate-500 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-slate-100 hover:bg-slate-50/50"
                  >
                    <td className="p-6 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-semibold border border-slate-200">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900">
                          {user.username}
                        </span>
                      </div>
                    </td>
                    <td className="p-6 align-middle">
                      <div className="flex items-center">
                        <RoleIcon role={user.role} />
                        <Badge
                          variant={
                            user.role === "Admin" ? "default" : "secondary"
                          }
                        >
                          {user.role}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-6 align-middle">
                      {/* Rendering Logic matches your original code, omitted for brevity */}
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {user.role === "Admin" ? (
                          <span className="text-slate-500 text-xs italic">
                            Full Access
                          </span>
                        ) : user.permissions && user.permissions.length > 0 ? (
                          user.permissions.slice(0, 3).map((p, i) => (
                            <span key={i} className="bg-slate-100 px-2 rounded">
                              {p}
                            </span>
                          ))
                        ) : (
                          <span>None</span>
                        )}
                      </div>
                    </td>
                    <td className="p-6 align-middle text-right">
                      {user.role !== "Admin" && (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(user)}
                          >
                            <Pencil className="h-4 w-4 text-slate-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:text-red-600"
                            onClick={() => {
                              setEditingUser(user);
                              setIsDeleteAlertOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals and Delete Alerts code matches your original exactly, just utilizing the updated state */}
      {/* ... Insert your Modal/Alert UI code here ... */}

      {/* --- Create/Edit User Modal (Simplified for display) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white p-6 rounded-xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-xl font-bold">
                {editingUser ? "Edit" : "Create"} User
              </h2>
              <div>
                <Label>Username</Label>
                <Input
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder={editingUser ? "Leave empty to keep" : "Required"}
                  required={!editingUser}
                />
              </div>
              <div>
                <Label>Role</Label>
                <select
                  className="w-full border p-2 rounded"
                  value={formData.role}
                  onChange={handleRoleChange}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {navLinks.map((link) => (
                    <div key={link.href} className="flex items-center gap-2">
                      <Switch
                        checked={formData.permissions.includes(link.href)}
                        onCheckedChange={() =>
                          handleTogglePermission(link.href)
                        }
                        disabled={formData.role === "Admin"}
                      />
                      <span className="text-sm">{link.title}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleCloseModal}
                >
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteAlertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-xl">
            <p>Are you sure you want to delete this user?</p>
            <div className="flex gap-2 mt-4 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsDeleteAlertOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(editingUser.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
