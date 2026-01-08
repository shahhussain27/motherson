import { NextResponse } from "next/server";
import { createConnection } from "@/lib/db";

// GET: Fetch Stations Data
export async function GET(req) {
  try {
    const conn = await createConnection();
    const { searchParams } = new URL(req.url);
    const unit = searchParams.get("unit");
    
    let query = "SELECT * FROM stations_requirement ORDER BY period_end DESC";
    let params = [];

    if (unit) {
      query = "SELECT * FROM stations_requirement WHERE unit = ? ORDER BY period_end DESC";
      params = [unit];
    }

    const [rows] = await conn.query(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Edit Stations Data
export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, total_stations_required, total_ctq_stations_required } = body;

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const conn = await createConnection();
    const query = `
      UPDATE stations_requirement 
      SET total_stations_required=?, total_ctq_stations_required=?
      WHERE id=?`;
      
    await conn.query(query, [total_stations_required, total_ctq_stations_required, id]);

    return NextResponse.json({ success: true, message: "Stations updated" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
