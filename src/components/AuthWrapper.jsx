"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function AuthWrapper({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // 2. Unauthenticated User (Not logged in)
  if (!user) {
    // Allow access to login page only
    if (pathname === "/login") return children;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 space-y-4">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="text-lg">Your are not login go back to login page</p>
        <Button onClick={() => router.push("/login")}>Go to Login</Button>
      </div>
    );
  }

  // 3. Authenticated but Unauthorized for specific page
  // Skip check for login page or if user is Admin
  if (pathname !== "/login" && user.role !== "Admin") {
    // Check permissions
    // Note: Assuming navLinks hrefs match pathname exactly.
    // You might need more complex logic if you have dynamic routes like /users/[id]
    const hasPermission =
      user.permissions && user.permissions.includes(pathname);

    if (!hasPermission) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 space-y-4">
          <h1 className="text-2xl font-bold text-orange-600">
            Permission Denied
          </h1>
          <p className="text-lg">You have no access permission for this page</p>

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              Go Back
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      );
    }
  }

  // If on login page but already logged in, redirect to dashboard or first permitted page
  if (pathname === "/login" && user) {
    router.push("/allStations"); // or wherever
    return null;
  }

  // 4. Authorized
  return (
    <>
      {/* Optional: Add a global logout button somewhere visible, or pass it down */}
      {/* <div className="fixed top-4 right-4 z-50">
         <Button variant="secondary" size="sm" onClick={handleLogout}>Logout</Button>
      </div> */}
      {children}
    </>
  );
}
