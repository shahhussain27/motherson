import { NextResponse } from "next/server";
import { createConnection } from "@/lib/db";

// GET: Fetch Data
export async function GET(req) {
  try {
    const conn = await createConnection();
    const { searchParams } = new URL(req.url);
    const unit = searchParams.get("unit");
    
    let query = "SELECT * FROM manpower_requirement ORDER BY period_end DESC";
    let params = [];

    // Optional: Filter by unit if provided
    if (unit) {
      query = "SELECT * FROM manpower_requirement WHERE unit = ? ORDER BY period_end DESC";
      params = [unit];
    }

    const [rows] = await conn.query(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Fetch Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Edit Functionality
export async function PUT(req) {
  try {
    const body = await req.json();
    const { 
      id, 
      total_operators_required, 
      buffer_manpower_required, 
      l1_required, 
      l2_required, 
      l3_required, 
      l4_required 
    } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const conn = await createConnection();
    
    const query = `
      UPDATE manpower_requirement 
      SET 
        total_operators_required = ?,
        buffer_manpower_required = ?,
        l1_required = ?,
        l2_required = ?,
        l3_required = ?,
        l4_required = ?
      WHERE id = ?
    `;

    const values = [
      total_operators_required, 
      buffer_manpower_required, 
      l1_required, 
      l2_required, 
      l3_required, 
      l4_required,
      id
    ];

    await conn.query(query, values);

    return NextResponse.json({ success: true, message: "Record updated successfully" });
  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Cascading Delete Functionality
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const conn = await createConnection();

    // 1. First, fetch the record to identify the Unit and Period
    const [rows] = await conn.query("SELECT unit, period_start, period_end FROM manpower_requirement WHERE id = ?", [id]);
    
    if (rows.length === 0) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    const { unit, period_start, period_end } = rows[0];

    // Format dates for SQL matching if necessary (usually raw Date object works with mysql2, but strings prevent issues)
    // Assuming database returns Date objects, we pass them back into the queries.

    const criteria = [unit, period_start, period_end];

    console.log(`Deleting associated data for Unit: ${unit}, Start: ${period_start}, End: ${period_end}`);

    // 2. Perform Cascading Deletes on all associated tables
    // We use a transaction pattern (conceptually) by awaiting them sequentially.
    
    // Delete from attendance_data
    await conn.query(
      "DELETE FROM attendance_data WHERE unit = ? AND period_start = ? AND period_end = ?", 
      criteria
    );

    // Delete from stations_requirement
    await conn.query(
      "DELETE FROM stations_requirement WHERE unit = ? AND period_start = ? AND period_end = ?", 
      criteria
    );

    // Delete from ctq_manpower_requirement
    await conn.query(
      "DELETE FROM ctq_manpower_requirement WHERE unit = ? AND period_start = ? AND period_end = ?", 
      criteria
    );

    // 3. Finally, Delete the specific Manpower Requirement record
    await conn.query("DELETE FROM manpower_requirement WHERE id = ?", [id]);

    return NextResponse.json({ 
      success: true, 
      message: "Cascading delete completed. All associated data removed." 
    });

  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// import { NextResponse } from "next/server";
// import { createConnection } from "@/lib/db";

// // GET: Fetch Data
// export async function GET(req) {
//   try {
//     const conn = await createConnection();
//     const { searchParams } = new URL(req.url);
//     const unit = searchParams.get("unit");

//     const request = conn.request();
//     let query = "SELECT * FROM manpower_requirement ORDER BY period_end DESC";

//     // Optional: Filter by unit if provided
//     if (unit) {
//       request.input("unit", unit);
//       query = "SELECT * FROM manpower_requirement WHERE unit = @unit ORDER BY period_end DESC";
//     }

//     const result = await request.query(query);
//     return NextResponse.json(result.recordset);
//   } catch (error) {
//     console.error("Fetch Error:", error);
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }

// // PUT: Edit Functionality
// export async function PUT(req) {
//   try {
//     const body = await req.json();
//     const { 
//       id, 
//       total_operators_required, 
//       buffer_manpower_required, 
//       l1_required, 
//       l2_required, 
//       l3_required, 
//       l4_required 
//     } = body;

//     if (!id) {
//       return NextResponse.json({ error: "ID is required" }, { status: 400 });
//     }

//     const conn = await createConnection();
    
//     const query = `
//       UPDATE manpower_requirement 
//       SET 
//         total_operators_required = @total,
//         buffer_manpower_required = @buffer,
//         l1_required = @l1,
//         l2_required = @l2,
//         l3_required = @l3,
//         l4_required = @l4
//       WHERE id = @id
//     `;

//     await conn.request()
//       .input("total", total_operators_required)
//       .input("buffer", buffer_manpower_required)
//       .input("l1", l1_required)
//       .input("l2", l2_required)
//       .input("l3", l3_required)
//       .input("l4", l4_required)
//       .input("id", id)
//       .query(query);

//     return NextResponse.json({ success: true, message: "Record updated successfully" });
//   } catch (error) {
//     console.error("Update Error:", error);
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }

// // DELETE: Cascading Delete Functionality
// export async function DELETE(req) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const id = searchParams.get("id");

//     if (!id) {
//       return NextResponse.json({ error: "ID is required" }, { status: 400 });
//     }

//     const conn = await createConnection();

//     // 1. First, fetch the record to identify the Unit and Period
//     const fetchReq = conn.request();
//     fetchReq.input("id", id);
//     const result = await fetchReq.query("SELECT unit, period_start, period_end FROM manpower_requirement WHERE id = @id");
    
//     if (result.recordset.length === 0) {
//       return NextResponse.json({ error: "Record not found" }, { status: 404 });
//     }

//     const { unit, period_start, period_end } = result.recordset[0];

//     console.log(`Deleting associated data for Unit: ${unit}, Start: ${period_start}, End: ${period_end}`);

//     // 2. Perform Cascading Deletes on all associated tables
//     // We create a new request object and bind the criteria variables
//     const deleteReq = conn.request()
//       .input("unit", unit)
//       .input("start", period_start)
//       .input("end", period_end)
//       .input("targetId", id);

//     // SQL Server allows executing multiple statements in one go, usually separated by semicolons
//     // This is more efficient and treats it closer to a transaction
//     await deleteReq.query(`
//       DELETE FROM attendance_data WHERE unit = @unit AND period_start = @start AND period_end = @end;
//       DELETE FROM stations_requirement WHERE unit = @unit AND period_start = @start AND period_end = @end;
//       DELETE FROM ctq_manpower_requirement WHERE unit = @unit AND period_start = @start AND period_end = @end;
//       DELETE FROM manpower_requirement WHERE id = @targetId;
//     `);

//     return NextResponse.json({ 
//       success: true, 
//       message: "Cascading delete completed. All associated data removed." 
//     });

//   } catch (error) {
//     console.error("Delete Error:", error);
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }