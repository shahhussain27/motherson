import { NextResponse } from "next/server";
import { createConnection } from "@/lib/db";
import bcrypt from "bcryptjs";
import { ensureTables } from "@/lib/initDb";

// TODO: Ensure request is from Admin

export async function GET() {
  try {
    const db = await createConnection();
    const [rows] = await db.query(
      "SELECT id, username, role, permissions FROM users"
    );
    // Parse permissions JSON string back to array
    const users = rows.map((u) => ({
      ...u,
      permissions: u.permissions ? JSON.parse(u.permissions) : [],
    }));
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await ensureTables();

    const { username, password, role, permissions } = await req.json();
    const db = await createConnection();

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const permString = JSON.stringify(permissions);

    await db.query(
      "INSERT INTO users (username, password, role, permissions) VALUES (?, ?, ?, ?)",
      [username, hashedPassword, role, permString]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { id, username, password, role, permissions } = await req.json();
    const db = await createConnection();
    const permString = JSON.stringify(permissions);

    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query(
        "UPDATE users SET username=?, password=?, role=?, permissions=? WHERE id=?",
        [username, hashedPassword, role, permString, id]
      );
    } else {
      await db.query(
        "UPDATE users SET username=?, role=?, permissions=? WHERE id=?",
        [username, role, permString, id]
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const db = await createConnection();
    await db.query("DELETE FROM users WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
