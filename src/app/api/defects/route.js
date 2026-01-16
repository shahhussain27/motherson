import { NextResponse } from "next/server";
import { createConnection } from "@/lib/db";

// GET: Fetch Defects (with filters & pagination)
export async function GET(request) {

  const { searchParams } = new URL(request.url);
  const gp_no = searchParams.get("gp_no");

  const conn = await createConnection();

  // CASE 1: Employee Lookup (if gp_no is provided)
  if (gp_no) {
    const [rows] = await conn.query(
      `SELECT name FROM attendance_data WHERE gp_no = ? ORDER BY created_at DESC LIMIT 1`,
      [gp_no]
    );
    if (rows.length > 0)
      return NextResponse.json({ success: true, name: rows[0].name });
    return NextResponse.json(
      { success: false, message: "Not found" },
      { status: 404 }
    );
  }

  // CASE 2: Fetch Table Data
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const unit = searchParams.get("unit");
  const skill = searchParams.get("skill");
  const offset = (page - 1) * limit;

  let query = "SELECT * FROM daily_defects WHERE 1=1";
  const params = [];

  if (unit && unit !== "all") {
    query += " AND unit = ?";
    params.push(unit);
  }
  if (skill && skill !== "all") {
    query += " AND skill_level = ?";
    params.push(skill);
  }

  // Get total count
  const [countRes] = await conn.query(
    `SELECT COUNT(*) as total FROM (${query}) as sub`,
    params
  );

  // Get data
  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);
  const [rows] = await conn.query(query, params);

  return NextResponse.json({
    data: rows,
    totalPages: Math.ceil(countRes[0].total / limit),
    currentPage: page,
  });
}

// POST: Save Defect
export async function POST(request) {
  const body = await request.json();
  const conn = await createConnection();

  // Verify Employee
  const [emp] = await conn.query(
    `SELECT name FROM attendance_data WHERE gp_no = ? LIMIT 1`,
    [body.gp_no]
  );

  if (emp.length === 0) {
    return NextResponse.json(
      { success: false, message: "Invalid GP No" },
      { status: 400 }
    );
  }

  try {
    await conn.query(
      `INSERT INTO daily_defects (defect_date, defect_type, defect_source, skill_level, unit, gp_no, employee_name) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        body.date,
        body.defect_type,
        body.defect_source,
        body.skill_level,
        body.unit,
        body.gp_no,
        emp[0].name,
      ]
    );
    return NextResponse.json({ success: true, message: "Saved" });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "DB Error" },
      { status: 500 }
    );
  }
}
