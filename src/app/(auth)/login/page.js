"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";

const Page = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const [errors, setErrors] = useState({
    username: "",
    password: "",
    general: "",
  });

  const validate = () => {
    let valid = true;

    const newErrors = { username: "", password: "", general: "" };

    if (!username.trim()) {
      newErrors.username = "Username is required";
      valid = false;
    }
    if (!password.trim()) {
      newErrors.password = "Password is required";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

 const handleLogin = async () => {
    if (!validate()) return;
    
    setErrors({ ...errors, general: "" });
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Successful login
        window.location.href = "/allStations"; // Use window.location to force AuthWrapper to re-run
      } else {
        setErrors({ ...errors, general: data.message || "Login failed" });
        setIsLoading(false);
      }
    } catch (err) {
      setErrors({ ...errors, general: "An error occurred. Please try again." });
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex justify-end items-center px-2 lg:px-16 bg-cover bg-no-repeat"
      style={{ backgroundImage: `url('/Images/bg.webp')` }}
    >
      <Card className="w-[380px] shadow-2xl border border-gray-200 bg-white/90 backdrop-blur">
        <CardHeader className="text-center">
          <Image
            src="/Images/logo.jpeg"
            alt="Logo"
            width={80}
            height={80}
            className="w-20 mx-auto mb-2"
          />
          <CardTitle className="text-xl font-semibold">Login</CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Username */}
          <div>
            <label className="font-medium text-sm">Username</label>
            <Input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`mt-1 ${errors.username ? "border-red-500" : ""}`}
            />
            {errors.username && (
              <p className="text-sm text-red-600 mt-1">{errors.username}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="font-medium text-sm">Password</label>
            <div className="relative">
              <Input
                type={showPass ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`mt-1 pr-10 ${
                  errors.password ? "border-red-500" : ""
                }`}
              />

              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? (
                  <EyeOff className="h-5 w-5 text-gray-500" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-500" />
                )}
              </button>
            </div>

            {errors.password && (
              <p className="text-sm text-red-600 mt-1">{errors.password}</p>
            )}
          </div>

          {/* General Error */}
          {errors.general && (
            <p className="text-center text-red-600 text-sm">{errors.general}</p>
          )}

          <Button
            className="w-full text-white font-medium"
            onClick={handleLogin}
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
