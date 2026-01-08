// import { NextResponse } from "next/server";
// import { createConnection } from "@/lib/db";

// export const GET = async (request) => {
//   try {
//     const conn = await createConnection();

//     const query = `
//       SELECT 
//         DATE_FORMAT(combined.dt, '%b %Y') as month_display,
//         SUM(combined.plan_val) as total_plan,
//         SUM(combined.actual_val) as total_actual
//       FROM (
//         -- Part 1: Get Training Plans
//         SELECT 
//             plan_date as dt, 
//             total_training_plan as plan_val, 
//             0 as actual_val 
//         FROM training_plan
//         WHERE plan_date IS NOT NULL

//         UNION ALL

//         -- Part 2: Get Actual Students Created
//         SELECT 
//             createdAt as dt, 
//             0 as plan_val, 
//             1 as actual_val 
//         FROM users 
//         WHERE role = 'STUDENT' AND createdAt IS NOT NULL
//       ) as combined
//       -- Group by Year and Month to prevent Jan 2024 and Jan 2025 from merging
//       GROUP BY YEAR(combined.dt), MONTH(combined.dt), DATE_FORMAT(combined.dt, '%b %Y')
//       -- Order chronologically (Oldest to Newest)
//       ORDER BY YEAR(combined.dt) ASC, MONTH(combined.dt) ASC;
//     `;

//     const [rows] = await conn.query(query);

//     const formattedData = rows.map((row) => ({
//       month: row.month_display, 
//       joined: Number(row.total_actual) || 0,
//       trained: 0,
//       plan: Number(row.total_plan) || 0,
//       actual: Number(row.total_actual) || 0,
//     }));

//     return NextResponse.json({ data: formattedData });
//   } catch (error) {
//     console.error("Error fetching training summary data:", error);
//     return NextResponse.json(
//       { error: "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// };

import { NextResponse } from "next/server";
import { createConnection } from "@/lib/db";

export const GET = async (request) => {
  try {
    const conn = await createConnection();

    const query = `
      SELECT 
        DATE_FORMAT(combined.dt, '%b %Y') as month_display,
        SUM(combined.plan_val) as total_plan,
        SUM(combined.actual_val) as total_actual,
        SUM(combined.trained_val) as total_trained
      FROM (
        -- Part 1: Get Training Plans
        SELECT 
            plan_date as dt, 
            total_training_plan as plan_val, 
            0 as actual_val,
            0 as trained_val
        FROM training_plan
        WHERE plan_date IS NOT NULL

        UNION ALL

        -- Part 2: Get Actual Students Created & Trained Status
        SELECT 
            createdAt as dt, 
            0 as plan_val, 
            1 as actual_val,
            CASE WHEN currentLevel = 'L1' THEN 1 ELSE 0 END as trained_val
        FROM users 
        WHERE role = 'STUDENT' AND createdAt IS NOT NULL
      ) as combined
      -- Group by Year and Month
      GROUP BY YEAR(combined.dt), MONTH(combined.dt), DATE_FORMAT(combined.dt, '%b %Y')
      -- Order chronologically
      ORDER BY YEAR(combined.dt) ASC, MONTH(combined.dt) ASC;
    `;

    const [rows] = await conn.query(query);

    const formattedData = rows.map((row) => ({
      month: row.month_display,
      joined: Number(row.total_actual) || 0,
      trained: Number(row.total_trained) || 0, // Now mapped from SQL result
      plan: Number(row.total_plan) || 0,
      actual: Number(row.total_actual) || 0,
    }));

    return NextResponse.json({ data: formattedData });
  } catch (error) {
    console.error("Error fetching training summary data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
};