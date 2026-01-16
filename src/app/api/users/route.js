// import { NextResponse } from "next/server";
// import { createConnection } from "@/lib/db";
// import bcrypt from "bcryptjs";

// // TODO: Ensure request is from Admin

// export async function GET() {
//   try {
//     const db = await createConnection();
//     const [rows] = await db.query(
//       "SELECT id, username, role, permissions FROM dashboard_users"
//     );
//     // Parse permissions JSON string back to array
//     const users = rows.map((u) => ({
//       ...u,
//       permissions: u.permissions ? JSON.parse(u.permissions) : [],
//     }));
//     return NextResponse.json(users);
//   } catch (error) {
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }

// export async function POST(req) {
//   try {

//     const { username, password, role, permissions } = await req.json();
//     const db = await createConnection();

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const permString = JSON.stringify(permissions);

//     await db.query(
//       "INSERT INTO dashboard_users (username, password, role, permissions) VALUES (?, ?, ?, ?)",
//       [username, hashedPassword, role, permString]
//     );

//     return NextResponse.json({ success: true });
//   } catch (error) {
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }

// export async function PUT(req) {
//   try {
//     const { id, username, password, role, permissions } = await req.json();
//     const db = await createConnection();
//     const permString = JSON.stringify(permissions);

//     if (password && password.trim() !== "") {
//       const hashedPassword = await bcrypt.hash(password, 10);
//       await db.query(
//         "UPDATE dashboard_users SET username=?, password=?, role=?, permissions=? WHERE id=?",
//         [username, hashedPassword, role, permString, id]
//       );
//     } else {
//       await db.query(
//         "UPDATE dashboard_users SET username=?, role=?, permissions=? WHERE id=?",
//         [username, role, permString, id]
//       );
//     }
//     return NextResponse.json({ success: true });
//   } catch (error) {
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }

// export async function DELETE(req) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const id = searchParams.get("id");
//     const db = await createConnection();
//     await db.query("DELETE FROM users WHERE id = ?", [id]);
//     return NextResponse.json({ success: true });
//   } catch (error) {
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }


import { NextResponse } from "next/server";
import { createConnection } from "@/lib/db";
import bcrypt from "bcryptjs";

// TODO: Ensure request is from Admin (Add middleware check here later)

export async function GET() {
  try {
    const db = await createConnection();
    // MSSQL returns result object, access rows via result.recordset
    const result = await db.request().query("SELECT id, username, role, permissions FROM dashboard_users");
    
    // Parse permissions JSON string back to array
    const users = result.recordset.map((u) => ({
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
    const { username, password, role, permissions } = await req.json();
    const db = await createConnection();

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const permString = JSON.stringify(permissions);

    await db.request()
      .input("username", username)
      .input("password", hashedPassword)
      .input("role", role)
      .input("permissions", permString)
      .query("INSERT INTO dashboard_users (username, password, role, permissions) VALUES (@username, @password, @role, @permissions)");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Create User Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { id, username, password, role, permissions } = await req.json();
    const db = await createConnection();
    const permString = JSON.stringify(permissions);

    const request = db.request()
      .input("id", id)
      .input("username", username)
      .input("role", role)
      .input("permissions", permString);

    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      request.input("password", hashedPassword);
      
      await request.query(
        "UPDATE dashboard_users SET username=@username, password=@password, role=@role, permissions=@permissions WHERE id=@id"
      );
    } else {
      await request.query(
        "UPDATE dashboard_users SET username=@username, role=@role, permissions=@permissions WHERE id=@id"
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update User Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const db = await createConnection();
    
    // Note: Table name in your original GET was dashboard_users, but DELETE had 'users'. 
    // I have corrected it to dashboard_users to match the rest.
    await db.request()
      .input("id", id)
      .query("DELETE FROM dashboard_users WHERE id = @id");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete User Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}