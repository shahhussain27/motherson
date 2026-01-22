import { NextResponse } from "next/server";
import { createConnection } from "@/lib/db";

export async function GET() {
  try {
    const db = await createConnection();
    // Order by latest month first
    const [rows] = await db.query(
      "SELECT * FROM training_plan ORDER BY plan_date DESC"
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch training plans" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { period_end, total_training_plan } = body;

    if (!period_end || total_training_plan === undefined) {
      return NextResponse.json(
        { error: "Missing required fields (Date, Total Plan)" },
        { status: 400 }
      );
    }

    const dateString = String(period_end);

    const plan_date = `${dateString.substring(0, 7)}-01`;

    const db = await createConnection();

    // Insert or Update (Upsert) logic
    // If July 2026 exists, it updates the count. If not, it inserts.
    const sql = `
      INSERT INTO training_plan (plan_date, total_training_plan)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE 
        total_training_plan = VALUES(total_training_plan)
    `;

    await db.query(sql, [plan_date, total_training_plan]);

    return NextResponse.json(
      { message: "Training plan saved successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: "Failed to save training plan" },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, total_training_plan } = body;

    if (!id || total_training_plan === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = await createConnection();
    await db.query(
      "UPDATE training_plan SET total_training_plan = ? WHERE id = ?",
      [total_training_plan, id]
    );

    return NextResponse.json({ message: "Updated successfully" });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: "Failed to update record" },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const db = await createConnection();
    await db.query("DELETE FROM training_plan WHERE id = ?", [id]);

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: "Failed to delete record" },
      { status: 500 }
    );
  }
}


// import { NextResponse } from "next/server";
// import { createConnection } from "@/lib/db";

// export async function GET() {
//   try {
//     const db = await createConnection();
//     // Order by latest month first
//     const result = await db.request().query("SELECT * FROM training_plan ORDER BY plan_date DESC");

//     return NextResponse.json(result.recordset);
//   } catch (error) {
//     console.error("Database Error:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch training plans" },
//       { status: 500 }
//     );
//   }
// }

// export async function POST(req) {
//   try {
//     const body = await req.json();
//     const { period_end, total_training_plan } = body;

//     if (!period_end || total_training_plan === undefined) {
//       return NextResponse.json(
//         { error: "Missing required fields (Date, Total Plan)" },
//         { status: 400 }
//       );
//     }

//     const dateString = String(period_end);
//     // Convert to 1st of the month (YYYY-MM-01)
//     const plan_date = `${dateString.substring(0, 7)}-01`;

//     const db = await createConnection();

//     // Upsert Logic for SQL Server (Check if exists, then Update or Insert)
//     const upsertQuery = `
//       IF EXISTS (SELECT 1 FROM training_plan WHERE plan_date = @date)
//       BEGIN
//         UPDATE training_plan 
//         SET total_training_plan = @total 
//         WHERE plan_date = @date
//       END
//       ELSE
//       BEGIN
//         INSERT INTO training_plan (plan_date, total_training_plan)
//         VALUES (@date, @total)
//       END
//     `;

//     await db.request()
//       .input("date", plan_date)
//       .input("total", total_training_plan)
//       .query(upsertQuery);

//     return NextResponse.json(
//       { message: "Training plan saved successfully" },
//       { status: 201 }
//     );
//   } catch (error) {
//     console.error("Database Error:", error);
//     return NextResponse.json(
//       { error: "Failed to save training plan" },
//       { status: 500 }
//     );
//   }
// }

// export async function PUT(req) {
//   try {
//     const body = await req.json();
//     const { id, total_training_plan } = body;

//     if (!id || total_training_plan === undefined) {
//       return NextResponse.json(
//         { error: "Missing required fields" },
//         { status: 400 }
//       );
//     }

//     const db = await createConnection();
    
//     await db.request()
//       .input("total", total_training_plan)
//       .input("id", id)
//       .query("UPDATE training_plan SET total_training_plan = @total WHERE id = @id");

//     return NextResponse.json({ message: "Updated successfully" });
//   } catch (error) {
//     console.error("Database Error:", error);
//     return NextResponse.json(
//       { error: "Failed to update record" },
//       { status: 500 }
//     );
//   }
// }

// export async function DELETE(req) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const id = searchParams.get("id");

//     if (!id) {
//       return NextResponse.json({ error: "ID is required" }, { status: 400 });
//     }

//     const db = await createConnection();
    
//     await db.request()
//       .input("id", id)
//       .query("DELETE FROM training_plan WHERE id = @id");

//     return NextResponse.json({ message: "Deleted successfully" });
//   } catch (error) {
//     console.error("Database Error:", error);
//     return NextResponse.json(
//       { error: "Failed to delete record" },
//       { status: 500 }
//     );
//   }
// }