import { NextResponse } from "next/server";
import { createConnection } from "@/lib/db";

// GET: Fetch CTQ Data
export async function GET(req) {
  try {
    const conn = await createConnection();
    const { searchParams } = new URL(req.url);
    const unit = searchParams.get("unit");
    
    
    let query = "SELECT * FROM ctq_manpower_requirement ORDER BY period_end DESC";
    let params = [];

    if (unit) {
      query = "SELECT * FROM ctq_manpower_requirement WHERE unit = ? ORDER BY period_end DESC";
      params = [unit];
    }

    const [rows] = await conn.query(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Edit CTQ Data
export async function PUT(req) {
  try {
    const body = await req.json();
    const { 
      id, total_ctq_operators_required, buffer_ctq_required, 
      l1_required, l2_required, l3_required, l4_required 
    } = body;

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const conn = await createConnection();
    const query = `
      UPDATE ctq_manpower_requirement 
      SET total_ctq_operators_required=?, buffer_ctq_required=?, 
          l1_required=?, l2_required=?, l3_required=?, l4_required=?
      WHERE id=?`;
      
    await conn.query(query, [
      total_ctq_operators_required, buffer_ctq_required,
      l1_required, l2_required, l3_required, l4_required, id
    ]);

    return NextResponse.json({ success: true, message: "CTQ Manpower updated" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


// import { NextResponse } from "next/server";
// import { createConnection } from "@/lib/db";

// // GET: Fetch CTQ Data
// export async function GET(req) {
//   try {
//     const conn = await createConnection();
//     const { searchParams } = new URL(req.url);
//     const unit = searchParams.get("unit");

//     const request = conn.request();
//     let query = "SELECT * FROM ctq_manpower_requirement ORDER BY period_end DESC";

//     if (unit) {
//       // Bind parameter for safe execution
//       request.input("unit", unit);
//       query = "SELECT * FROM ctq_manpower_requirement WHERE unit = @unit ORDER BY period_end DESC";
//     }

//     const result = await request.query(query);
    
//     // MSSQL returns data in result.recordset
//     return NextResponse.json(result.recordset);
//   } catch (error) {
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }

// // PUT: Edit CTQ Data
// export async function PUT(req) {
//   try {
//     const body = await req.json();
//     const { 
//       id, total_ctq_operators_required, buffer_ctq_required, 
//       l1_required, l2_required, l3_required, l4_required 
//     } = body;

//     if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

//     const conn = await createConnection();

//     // Use named parameters (@param) instead of '?'
//     const query = `
//       UPDATE ctq_manpower_requirement 
//       SET total_ctq_operators_required = @total, 
//           buffer_ctq_required = @buffer, 
//           l1_required = @l1, 
//           l2_required = @l2, 
//           l3_required = @l3, 
//           l4_required = @l4
//       WHERE id = @id`;
      
//     await conn.request()
//       .input("total", total_ctq_operators_required)
//       .input("buffer", buffer_ctq_required)
//       .input("l1", l1_required)
//       .input("l2", l2_required)
//       .input("l3", l3_required)
//       .input("l4", l4_required)
//       .input("id", id)
//       .query(query);

//     return NextResponse.json({ success: true, message: "CTQ Manpower updated" });
//   } catch (error) {
//     console.error("Update Error:", error);
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }