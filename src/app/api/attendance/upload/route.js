import { NextResponse } from "next/server";
import { createConnection } from "@/lib/db";
import { ensureTables } from "@/lib/initDb";
import { parseAttendanceExcel } from "@/lib/attendanceParser";

export const runtime = "nodejs";

export async function POST(req) {
  let conn;
  try {
    await ensureTables();

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse excel
    const { period_start, period_end, unitFromHeader, records } =
      parseAttendanceExcel(buffer);
    let unit = unitFromHeader;

    conn = await createConnection();

    // 1) Check if this period already exists => block duplicate upload
    const [existing] = await conn.query(
      `
      SELECT COUNT(*) AS count
      FROM attendance_data
      WHERE period_start = ? AND period_end = ? AND unit = ?
    `,
      [period_start, period_end, unitFromHeader]
    );

    if (existing[0].count > 0) {
      return NextResponse.json(
        {
          error: `Attendance for period ${period_start} to ${period_end} is already uploaded.`,
        },
        { status: 400 }
      );
    }

    // 2) Bulk insert records

    const BATCH_SIZE = 500;
    const insertQuery = `
      INSERT INTO attendance_data (
        period_start, period_end, attendance_date, gp_no, name, 
        father_or_husband_name, unit, skill_type, designation, contractor, 
        section, sub_section, attendance_code, pd, lv, wo, 
        ph, p_ph, ot_hours, phot_hours, total_days, 
        absent_days, pow
      ) VALUES ?
    `;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);

      const values = batch.map((r) => [
        r.period_start,
        r.period_end,
        r.attendance_date,
        r.gp_no,
        r.name,
        r.father_or_husband_name,
        r.unit,
        r.skill_type,
        r.designation,
        r.contractor,
        r.section,
        r.sub_section,
        r.attendance_code,
        r.pd,
        r.lv,
        r.wo,
        r.ph,
        r.p_ph,
        r.ot_hours,
        r.phot_hours,
        r.total_days,
        r.absent_days,
        r.pow,
      ]);

      if (values.length > 0) {
        await conn.query(insertQuery, [values]);
      }
    }

    // 3) Optionally: create “placeholder” rows in requirement tables for this period
    // (unit NULL – you can later update with unit-wise data)
    await conn.query(
      `
      INSERT IGNORE INTO manpower_requirement (period_start, period_end, unit)
      VALUES (?, ?, ?)
    `,
      [period_start, period_end, unit]
    );

    await conn.query(
      `
      INSERT IGNORE INTO stations_requirement (period_start, period_end, unit)
      VALUES (?, ?, ?)
    `,
      [period_start, period_end, unit]
    );

    await conn.query(
      `
      INSERT IGNORE INTO ctq_manpower_requirement (period_start, period_end, unit)
      VALUES (?, ?, ?)
    `,
      [period_start, period_end, unit]
    );

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
      {
        error: err.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
