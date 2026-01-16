// // app/api/defects/export/route.ts
// import { NextResponse } from "next/server";
// import { createConnection } from "@/lib/db";
// import * as XLSX from "xlsx";
// import { format } from "date-fns";

// export async function GET(request) {
//   const { searchParams } = new URL(request.url);
  
//   // Get Filters
//   const startDate = searchParams.get("startDate");
//   const endDate = searchParams.get("endDate");
//   const unit = searchParams.get("unit");
//   const skill = searchParams.get("skill");

//   const conn = await createConnection();

//   // Build Query
//   let query = `
//     SELECT 
//       id, 
//       DATE_FORMAT(defect_date, '%Y-%m-%d') as Date,
//       gp_no as 'GP Number',
//       employee_name as 'Employee Name',
//       unit as 'Unit',
//       defect_type as 'Defect Type',
//       defect_source as 'Source',
//       skill_level as 'Skill Level',
//       created_at as 'Timestamp'
//     FROM daily_defects 
//     WHERE 1=1
//   `;
  
//   const params = [];

//   // Apply Date Range Filter
//   if (startDate && endDate) {
//     query += " AND defect_date BETWEEN ? AND ?";
//     params.push(startDate, endDate);
//   }

//   // Apply other filters
//   if (unit && unit !== "all") {
//     query += " AND unit = ?";
//     params.push(unit);
//   }
//   if (skill && skill !== "all") {
//     query += " AND skill_level = ?";
//     params.push(skill);
//   }

//   query += " ORDER BY defect_date DESC";

//   const [rows] = await conn.query(query, params);

//   // --- Generate Excel ---
//   const worksheet = XLSX.utils.json_to_sheet(rows);
//   const workbook = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(workbook, worksheet, "Defects Data");

//   // Create buffer
//   const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

//   // Return file response
//   return new NextResponse(buf, {
//     status: 200,
//     headers: {
//       "Content-Disposition": `attachment; filename="defects_export_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx"`,
//       "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//     },
//   });
// }

import { NextResponse } from "next/server";
import { createConnection } from "@/lib/db";
import * as XLSX from "xlsx";
import { format } from "date-fns";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  
  // Get Filters
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const unit = searchParams.get("unit");
  const skill = searchParams.get("skill");

  const conn = await createConnection();
  const dbRequest = conn.request();

  // Build Query (MSSQL Syntax)
  // Note: FORMAT() requires SQL Server 2012+. If on older version, use CONVERT(varchar, defect_date, 23).
  let query = `
    SELECT 
      id, 
      FORMAT(defect_date, 'yyyy-MM-dd') as Date,
      gp_no as 'GP Number',
      employee_name as 'Employee Name',
      unit as 'Unit',
      defect_type as 'Defect Type',
      defect_source as 'Source',
      skill_level as 'Skill Level',
      created_at as 'Timestamp'
    FROM daily_defects 
    WHERE 1=1
  `;
  
  // Apply Date Range Filter
  if (startDate && endDate) {
    dbRequest.input("startDate", startDate);
    dbRequest.input("endDate", endDate);
    query += " AND defect_date BETWEEN @startDate AND @endDate";
  }

  // Apply other filters
  if (unit && unit !== "all") {
    dbRequest.input("unit", unit);
    query += " AND unit = @unit";
  }
  if (skill && skill !== "all") {
    dbRequest.input("skill", skill);
    query += " AND skill_level = @skill";
  }

  query += " ORDER BY defect_date DESC";

  // Execute Query
  const result = await dbRequest.query(query);
  const rows = result.recordset;

  // --- Generate Excel ---
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Defects Data");

  // Create buffer
  const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  // Return file response
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Disposition": `attachment; filename="defects_export_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx"`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}