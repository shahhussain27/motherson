// import { NextResponse } from "next/server";
// import { createConnection } from "@/lib/db";
// import { parseAttendanceExcel } from "@/lib/attendanceParser";

// export const runtime = "nodejs";

// export async function POST(req) {
//   let conn;
//   try {

//     const formData = await req.formData();
//     const file = formData.get("file");

//     if (!file) {
//       return NextResponse.json({ error: "File is required." }, { status: 400 });
//     }

//     const arrayBuffer = await file.arrayBuffer();
//     const buffer = Buffer.from(arrayBuffer);

//     // Parse excel
//     const { period_start, period_end, unitFromHeader, records } =
//       parseAttendanceExcel(buffer);
//     let unit = unitFromHeader;

//     conn = await createConnection();

//     // 1) Check if this period already exists => block duplicate upload
//     const [existing] = await conn.query(
//       `
//       SELECT COUNT(*) AS count
//       FROM attendance_data
//       WHERE period_start = ? AND period_end = ? AND unit = ?
//     `,
//       [period_start, period_end, unitFromHeader]
//     );

//     if (existing[0].count > 0) {
//       return NextResponse.json(
//         {
//           error: `Attendance for period ${period_start} to ${period_end} is already uploaded.`,
//         },
//         { status: 400 }
//       );
//     }

//     // 2) Bulk insert records

//     const BATCH_SIZE = 500;
//     const insertQuery = `
//       INSERT INTO attendance_data (
//         period_start, period_end, attendance_date, gp_no, name, 
//         father_or_husband_name, unit, skill_type, designation, contractor, 
//         section, sub_section, attendance_code, pd, lv, wo, 
//         ph, p_ph, ot_hours, phot_hours, total_days, 
//         absent_days, pow
//       ) VALUES ?
//     `;

//     for (let i = 0; i < records.length; i += BATCH_SIZE) {
//       const batch = records.slice(i, i + BATCH_SIZE);

//       const values = batch.map((r) => [
//         r.period_start,
//         r.period_end,
//         r.attendance_date,
//         r.gp_no,
//         r.name,
//         r.father_or_husband_name,
//         r.unit,
//         r.skill_type,
//         r.designation,
//         r.contractor,
//         r.section,
//         r.sub_section,
//         r.attendance_code,
//         r.pd,
//         r.lv,
//         r.wo,
//         r.ph,
//         r.p_ph,
//         r.ot_hours,
//         r.phot_hours,
//         r.total_days,
//         r.absent_days,
//         r.pow,
//       ]);

//       if (values.length > 0) {
//         await conn.query(insertQuery, [values]);
//       }
//     }

//     // 3) Optionally: create “placeholder” rows in requirement tables for this period
//     // (unit NULL – you can later update with unit-wise data)
//     await conn.query(
//       `
//       INSERT IGNORE INTO manpower_requirement (period_start, period_end, unit)
//       VALUES (?, ?, ?)
//     `,
//       [period_start, period_end, unit]
//     );

//     await conn.query(
//       `
//       INSERT IGNORE INTO stations_requirement (period_start, period_end, unit)
//       VALUES (?, ?, ?)
//     `,
//       [period_start, period_end, unit]
//     );

//     await conn.query(
//       `
//       INSERT IGNORE INTO ctq_manpower_requirement (period_start, period_end, unit)
//       VALUES (?, ?, ?)
//     `,
//       [period_start, period_end, unit]
//     );

//     return NextResponse.json({
//       success: true,
//       period_start,
//       period_end,
//       unit,
//       inserted_rows: records.length,
//       message: `Attendance uploaded successfully for ${period_start} to ${period_end}.`,
//     });
//   } catch (err) {
//     console.error("Upload error:", err);
//     return NextResponse.json(
//       {
//         error: err.message || "Internal server error",
//       },
//       { status: 500 }
//     );
//   }
// }


import { NextResponse } from "next/server";
import { createConnection, sql } from "@/lib/db"; // Ensure 'sql' is exported from db.js
import { parseAttendanceExcel } from "@/lib/attendanceParser";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse excel
    const { period_start, period_end, unitFromHeader, records } = parseAttendanceExcel(buffer);
    let unit = unitFromHeader;

    const conn = await createConnection();

    // ---------------------------------------------------------
    // 1) Check if period exists (Block duplicate upload)
    // ---------------------------------------------------------
    const checkResult = await conn.request()
      .input("pStart", period_start)
      .input("pEnd", period_end)
      .input("unit", unitFromHeader)
      .query(`
        SELECT COUNT(*) AS count
        FROM attendance_data
        WHERE period_start = @pStart AND period_end = @pEnd AND unit = @unit
      `);

    if (checkResult.recordset[0].count > 0) {
      return NextResponse.json(
        { error: `Attendance for period ${period_start} to ${period_end} is already uploaded.` },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // 2) Bulk insert records (Batch Size = 80 to fit MSSQL 2100 param limit)
    // ---------------------------------------------------------
    const BATCH_SIZE = 80; // approx 23 cols * 80 rows = 1840 params (< 2100 limit)

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      const request = conn.request(); // New request for every batch
      const valuesClauses = [];

      // Construct dynamic parameters: @p0_0, @p0_1, etc.
      batch.forEach((row, rowIndex) => {
        const p = `p${rowIndex}`; // Prefix for this row
        
        request.input(`${p}_start`, row.period_start);
        request.input(`${p}_end`, row.period_end);
        request.input(`${p}_date`, row.attendance_date);
        request.input(`${p}_gp`, row.gp_no);
        request.input(`${p}_name`, row.name);
        request.input(`${p}_fh`, row.father_or_husband_name);
        request.input(`${p}_unit`, row.unit);
        request.input(`${p}_skill`, row.skill_type);
        request.input(`${p}_desig`, row.designation);
        request.input(`${p}_cont`, row.contractor);
        request.input(`${p}_sec`, row.section);
        request.input(`${p}_subsec`, row.sub_section);
        request.input(`${p}_code`, row.attendance_code);
        request.input(`${p}_pd`, row.pd);
        request.input(`${p}_lv`, row.lv);
        request.input(`${p}_wo`, row.wo);
        request.input(`${p}_ph`, row.ph);
        request.input(`${p}_pph`, row.p_ph);
        request.input(`${p}_ot`, row.ot_hours);
        request.input(`${p}_phot`, row.phot_hours);
        request.input(`${p}_tot`, row.total_days);
        request.input(`${p}_abs`, row.absent_days);
        request.input(`${p}_pow`, row.pow);

        // Add the placeholders for this row
        valuesClauses.push(`(
          @${p}_start, @${p}_end, @${p}_date, @${p}_gp, @${p}_name, 
          @${p}_fh, @${p}_unit, @${p}_skill, @${p}_desig, @${p}_cont, 
          @${p}_sec, @${p}_subsec, @${p}_code, @${p}_pd, @${p}_lv, @${p}_wo, 
          @${p}_ph, @${p}_pph, @${p}_ot, @${p}_phot, @${p}_tot, 
          @${p}_abs, @${p}_pow
        )`);
      });

      if (valuesClauses.length > 0) {
        const query = `
          INSERT INTO attendance_data (
            period_start, period_end, attendance_date, gp_no, name, 
            father_or_husband_name, unit, skill_type, designation, contractor, 
            section, sub_section, attendance_code, pd, lv, wo, 
            ph, p_ph, ot_hours, phot_hours, total_days, 
            absent_days, pow
          ) VALUES ${valuesClauses.join(", ")}
        `;
        await request.query(query);
      }
    }

    // ---------------------------------------------------------
    // 3) Create "placeholder" rows (Using IF NOT EXISTS instead of INSERT IGNORE)
    // ---------------------------------------------------------
    const initReq = conn.request()
      .input("ps", period_start)
      .input("pe", period_end)
      .input("u", unit);

    // Manpower Requirement
    await initReq.query(`
      IF NOT EXISTS (SELECT 1 FROM manpower_requirement WHERE period_start = @ps AND period_end = @pe AND unit = @u)
      BEGIN
        INSERT INTO manpower_requirement (period_start, period_end, unit) VALUES (@ps, @pe, @u)
      END
    `);

    // Stations Requirement
    await initReq.query(`
      IF NOT EXISTS (SELECT 1 FROM stations_requirement WHERE period_start = @ps AND period_end = @pe AND unit = @u)
      BEGIN
        INSERT INTO stations_requirement (period_start, period_end, unit) VALUES (@ps, @pe, @u)
      END
    `);

    // CTQ Manpower Requirement
    await initReq.query(`
      IF NOT EXISTS (SELECT 1 FROM ctq_manpower_requirement WHERE period_start = @ps AND period_end = @pe AND unit = @u)
      BEGIN
        INSERT INTO ctq_manpower_requirement (period_start, period_end, unit) VALUES (@ps, @pe, @u)
      END
    `);

    return NextResponse.json({
      success: true,
      period_start,
      period_end,
      unit,
      inserted_rows: records.length,
      message: `Attendance uploaded successfully for ${period_start} to ${period_end}.`,
    });

  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}