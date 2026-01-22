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


// import { NextResponse } from "next/server";
// import { createConnection } from "@/lib/db";

// // GET: Fetch Defects (with filters & pagination)
// export async function GET(request) {
//   const { searchParams } = new URL(request.url);
//   const gp_no = searchParams.get("gp_no");

//   const conn = await createConnection();
//   const dbRequest = conn.request(); // Create a reusable request object

//   // CASE 1: Employee Lookup (if gp_no is provided)
//   if (gp_no) {
//     dbRequest.input("gp_no", gp_no);
//     const result = await dbRequest.query(
//       `SELECT TOP 1 name FROM attendance_data WHERE gp_no = @gp_no ORDER BY created_at DESC`
//     );

//     if (result.recordset.length > 0)
//       return NextResponse.json({ success: true, name: result.recordset[0].name });
    
//     return NextResponse.json(
//       { success: false, message: "Not found" },
//       { status: 404 }
//     );
//   }

//   // CASE 2: Fetch Table Data
//   const page = parseInt(searchParams.get("page") || "1");
//   const limit = parseInt(searchParams.get("limit") || "10");
//   const unit = searchParams.get("unit");
//   const skill = searchParams.get("skill");
//   const offset = (page - 1) * limit;

//   // Bind pagination inputs
//   dbRequest.input("limit", limit);
//   dbRequest.input("offset", offset);

//   // Build Query Conditions
//   let whereClause = "WHERE 1=1";

//   if (unit && unit !== "all") {
//     dbRequest.input("unit", unit);
//     whereClause += " AND unit = @unit";
//   }
//   if (skill && skill !== "all") {
//     dbRequest.input("skill", skill);
//     whereClause += " AND skill_level = @skill";
//   }

//   // Get total count
//   const countResult = await dbRequest.query(
//     `SELECT COUNT(*) as total FROM daily_defects ${whereClause}`
//   );

//   // Get data with Pagination (OFFSET-FETCH requires ORDER BY)
//   const dataQuery = `
//     SELECT * FROM daily_defects 
//     ${whereClause} 
//     ORDER BY created_at DESC 
//     OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
//   `;
  
//   const dataResult = await dbRequest.query(dataQuery);

//   return NextResponse.json({
//     data: dataResult.recordset,
//     totalPages: Math.ceil(countResult.recordset[0].total / limit),
//     currentPage: page,
//   });
// }

// // POST: Save Defect
// export async function POST(request) {
//   const body = await request.json();
//   const conn = await createConnection();
//   const dbRequest = conn.request();

//   // Verify Employee
//   dbRequest.input("check_gp", body.gp_no);
//   const empResult = await dbRequest.query(
//     `SELECT TOP 1 name FROM attendance_data WHERE gp_no = @check_gp`
//   );

//   if (empResult.recordset.length === 0) {
//     return NextResponse.json(
//       { success: false, message: "Invalid GP No" },
//       { status: 400 }
//     );
//   }

//   try {
//     const employeeName = empResult.recordset[0].name;

//     // Clear previous inputs and bind new ones for insert
//     // (Note: In mssql, it's safer to use a fresh request or just ensure variable names don't clash. 
//     // Since we used 'check_gp' above, we are safe to bind others now.)
    
//     dbRequest.input("date", body.date);
//     dbRequest.input("type", body.defect_type);
//     dbRequest.input("source", body.defect_source);
//     dbRequest.input("skill", body.skill_level);
//     dbRequest.input("unit", body.unit);
//     dbRequest.input("gp", body.gp_no);
//     dbRequest.input("name", employeeName);

//     await dbRequest.query(
//       `INSERT INTO daily_defects (defect_date, defect_type, defect_source, skill_level, unit, gp_no, employee_name) 
//        VALUES (@date, @type, @source, @skill, @unit, @gp, @name)`
//     );

//     return NextResponse.json({ success: true, message: "Saved" });
//   } catch (err) {
//     console.error("DB Error:", err);
//     return NextResponse.json(
//       { success: false, message: "DB Error" },
//       { status: 500 }
//     );
//   }
// }