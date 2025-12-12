import { NextResponse } from "next/server";
import { createConnection } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ensureTables } from "@/lib/initDb";

const SECRET_KEY = process.env.JWT_SECRET;

export async function POST(req) {
  try {
    await ensureTables();
    const { username, password } = await req.json();
    const db = await createConnection();

    // 1. Check User
    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    if (rows.length === 0) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const user = rows[0];

    // 2. Check Password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 3. Create Token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        permissions: user.permissions,
      },
      SECRET_KEY,
      { expiresIn: "8h" }
    );

    // 4. Set Cookie
    const response = NextResponse.json({
      success: true,
      user: { username: user.username, role: user.role },
    });
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "strict",
    });

    return response;
  } catch (error) {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
