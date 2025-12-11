import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const SECRET_KEY = process.env.JWT_SECRET;

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");

  if (!token) {
    return NextResponse.json({ user: null });
  }

  try {
    const decoded = jwt.verify(token.value, SECRET_KEY);
    // Parse permissions if they are stored as a JSON string in DB
    const permissions =
      typeof decoded.permissions === "string"
        ? JSON.parse(decoded.permissions)
        : decoded.permissions;

    return NextResponse.json({ user: { ...decoded, permissions } });
  } catch (e) {
    return NextResponse.json({ user: null });
  }
}
