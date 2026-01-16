// import { NextResponse } from "next/server";
// import { createConnection } from "@/lib/db";

// // Helper to construct dynamic WHERE clauses and Date Grouping
// const buildFilters = (params) => {
//   const { startDate, endDate, unit, skill, type } = params;
//   let conditions = [];
//   let values = [];

//   // Date Filter (applies to both attendance and requirements tables generally)
//   if (startDate && endDate) {
//     conditions.push("attendance_date BETWEEN ? AND ?");
//     values.push(startDate, endDate);
//   }

//   // Unit Filter
//   if (unit && unit !== "ALL") {
//     conditions.push("unit = ?");
//     values.push(unit);
//   }

//   // Skill Filter (Mapped to skill_type in DB)
//   if (skill && skill !== "ALL") {
//     const skillMap = {
//       "LEVEL-01": "LEVEL-01",
//       "LEVEL-02": "LEVEL-02",
//       "LEVEL-03": "LEVEL-03",
//       "LEVEL-04": "LEVEL-04",
//     };

//     conditions.push("Designation = ?");
//     values.push(skillMap[skill] || skill);
//   }

//   // Employment Type Filter
//   // Rule: "Permanent" = Contractor is "Not Applicable"
//   //       "Temporary" = Contractor is anything else (or NULL)
//   if (type && type !== "ALL") {
//     if (type === "Permanent") {
//       conditions.push("contractor = ?");
//       values.push("Not Applicable");
//     } else {
//       conditions.push("(contractor IS NULL OR contractor != ?)");
//       values.push("Not Applicable");
//     }
//   }

//   const whereClause =
//     conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

//   return { whereClause, values };
// };

// const getDateFormat = (periodicity) => {
//   switch (periodicity) {
//     case "day":
//       return "%Y-%m-%d";
//     case "year":
//       return "%Y";
//     case "month":
//     default:
//       return "%M"; // Full month name like 'January'
//   }
// };

// export async function GET(request) {
//   const { searchParams } = new URL(request.url);
//   const startDate =
//     searchParams.get("startDate") || new Date().toISOString().split("T")[0];
//   const endDate =
//     searchParams.get("endDate") || new Date().toISOString().split("T")[0];
//   const unit = searchParams.get("unit");
//   const skill = searchParams.get("skill");
//   const type = searchParams.get("type");
//   const periodicity = searchParams.get("periodicity") || "month"; // 'day', 'month', 'year'

//   const conn = await createConnection();
//   const filters = buildFilters({ startDate, endDate, unit, skill, type });
//   const dateFormat = getDateFormat(periodicity);

//   try {
//     // ---------------------------------------------------------
//     // 1. Manpower Availability Trend (Available vs Required)
//     // ---------------------------------------------------------
//     // We aggregate attendance_data for Available and manpower_requirement for Required

//     // Note: manpower_requirement is stored by period. We need to join roughly on dates.
//     // Simplifying: Fetch aggregated availability from attendance_data first

//     const availabilityQuery = `
//       SELECT 
//         DATE_FORMAT(attendance_date, '${dateFormat}') as time_label,
//         COUNT(DISTINCT gp_no) as available_count,
//         SUM(absent_days) as total_absent,
//         SUM(total_days) as total_working_days,
//         COUNT(DISTINCT CASE WHEN Designation LIKE '%LEVEL-01%' THEN gp_no END) as l1_avail,
//         COUNT(DISTINCT CASE WHEN Designation LIKE '%LEVEL-02%' THEN gp_no END) as l2_avail,
//         COUNT(DISTINCT CASE WHEN Designation LIKE '%LEVEL-03%' THEN gp_no END) as l3_avail,
//         COUNT(DISTINCT CASE WHEN Designation LIKE '%LEVEL-04%' THEN gp_no END) as l4_avail,
//         COUNT(DISTINCT CASE WHEN contractor = 'Not Applicable' THEN gp_no END) as perm_avail,
//         COUNT(DISTINCT CASE WHEN (contractor IS NULL OR contractor != 'Not Applicable') THEN gp_no END) as temp_avail
//       FROM attendance_data
//       ${filters.whereClause}
//       GROUP BY time_label
//       ORDER BY MIN(attendance_date) ASC
//     `;

//     //   Attrition Logic
//     //fetch WHO was present in each month to compare sets.
//     const attritionRawQuery = `
//         SELECT DISTINCT gp_no, DATE_FORMAT(attendance_date, '${dateFormat}') as time_label
//         FROM attendance_data
//         ${filters.whereClause}
//         ORDER BY attendance_date ASC
//     `;

//     // We need a separate query for requirements because they might not have a 1:1 row per employee
//     // Using a subquery approach for requirements based on date range overlap
//     const requirementQuery = `
//         SELECT 
//             DATE_FORMAT(period_end, '${dateFormat}') as time_label,
//             SUM(total_operators_required) as required_count,
//             SUM(buffer_manpower_required) as buffer_req,
//             SUM(l1_required) as l1_req,
//             SUM(l2_required) as l2_req,
//             SUM(l3_required) as l3_req,
//             SUM(l4_required) as l4_req
//         FROM manpower_requirement
//         WHERE period_end BETWEEN ? AND ? 
//         ${unit && unit !== "ALL" ? "AND unit = ?" : ""}
//         GROUP BY time_label
//     `;

//     const [availRows] = await conn.query(availabilityQuery, filters.values);
//     const [attritionRows] = await conn.query(attritionRawQuery, filters.values);

//     // Req filter values logic
//     const reqValues = [startDate, endDate];
//     if (unit && unit !== "ALL") reqValues.push(unit);
//     const [reqRows] = await conn.query(requirementQuery, reqValues);

//     // ---------------------------------------------------------
//     // Process Attrition
//     // ---------------------------------------------------------
//     // Group gp_nos by month
//     const employeesByMonth = {};
//     attritionRows.forEach((row) => {
//       if (!employeesByMonth[row.time_label]) {
//         employeesByMonth[row.time_label] = new Set();
//       }
//       employeesByMonth[row.time_label].add(row.gp_no);
//     });

//     const timeLabels = Object.keys(employeesByMonth).sort(); // chronological order

//     const attritionMap = {};

//     timeLabels.forEach((currentMonth, index) => {
//       const nextMonth = timeLabels[index + 1];

//       // We can only calculate exits if we have data for the NEXT month.
//       // If nextMonth is undefined (it's the last month selected), attrition is 0/Unknown.
//       if (nextMonth) {
//         const currentEmployees = employeesByMonth[currentMonth];
//         const nextEmployees = employeesByMonth[nextMonth];

//         let exits = 0;
//         currentEmployees.forEach((emp) => {
//           // Logic: If in Current but NOT in Next -> They exited
//           if (!nextEmployees.has(emp)) {
//             exits++;
//           }
//         });

//         // Formula: (Exits / Headcount Start of Month) * 100
//         const headcount = currentEmployees.size;
//         const rate = headcount > 0 ? ((exits / headcount) * 100).toFixed(1) : 0;

//         attritionMap[currentMonth] = rate;
//       } else {
//         attritionMap[currentMonth] = 0; // Or null, since we can't predict next month yet
//       }
//     });

//     // Merge Data for Trends
//     // We iterate over the availability rows (as they drive the "actuals") and find matching requirements
//     const combinedData = availRows.map((row) => {
//       const reqMatch =
//         reqRows.find((r) => r.time_label === row.time_label) || {};
//       const required = Number(reqMatch.required_count || 0);
//       const available = Number(row.available_count || 0);
//       const bufferReq = Number(reqMatch.buffer_req || 0);

//       // Standard Formulas

//       // 1. Buffer Availability Trend
//       // Formula: Actual Buffer = (Available - Required). If negative, 0 buffer.
//       // Or if 'buffer' means specifically extra staff:
//       const bufferAvailable = Math.max(0, available - required);

//       // 2. Absenteeism Rate
//       // Formula: (Total Absent Days / Total Scheduled Days) * 100
//       const totalDays = Number(row.total_working_days || 1); // prevent div by 0
//       const absentDays = Number(row.total_absent || 0);
//       const absenteeismRate = ((absentDays / totalDays) * 100).toFixed(1);

//       // 3. Attrition Rate (Simplified)
//       // Standard Formula: (Separations / Avg Headcount) * 100.
//       const attritionRate = Number(attritionMap[row.time_label] || 0);

//       return {
//         month: row.time_label, // Used for XAxis
//         required: required,
//         available: available,
//         bufferRate: bufferAvailable, // For Buffer Trend
//         absenteeismRate: absenteeismRate,
//         attritionRate: attritionRate,
//         bufferReq,
//         // Skill Breakdowns for Cards
//         permCount: Number(row.perm_avail || 0),
//         tempCount: Number(row.temp_avail || 0),
//         details: {
//           l1: {
//             req: Number(reqMatch.l1_req || 0),
//             avail: Number(row.l1_avail || 0),
//           },
//           l2: {
//             req: Number(reqMatch.l2_req || 0),
//             avail: Number(row.l2_avail || 0),
//           },
//           l3: {
//             req: Number(reqMatch.l3_req || 0),
//             avail: Number(row.l3_avail || 0),
//           },
//           l4: {
//             req: Number(reqMatch.l4_req || 0),
//             avail: Number(row.l4_avail || 0),
//           },
//         },
//       };
//     });

//     // ---------------------------------------------------------
//     // 2. Aggregate Totals for Top Cards (Snapshot of whole selected period)
//     // ---------------------------------------------------------
//     // Taking the average or sum depending on business logic. Usually 'Current' status is last day,
//     // but for a range, we might average or take the latest.

//     // Station Logic (from stations_requirement)
//     const [stationRows] = await conn.query(
//       `
//         SELECT SUM(total_stations_required) as total_stations
//         FROM stations_requirement 
//         WHERE period_start BETWEEN ? AND ?
//         ${unit && unit !== "ALL" ? "AND unit = ?" : ""}
//     `,
//       reqValues
//     );

//     const latest = combinedData[combinedData.length - 1] || {};
//     // Data structures for Frontend Graphs
//     const responsePayload = {
//       // Top Cards
//       cards: [
//         { title: "Total Stations", value: stationRows[0]?.total_stations || 0 },
//         { title: "Total Operators Required", value: latest.required || 0 },
//         { title: "Total Operators Available", value: latest.available || 0 },
//         { title: "Buffer Manpower Required", value: latest.bufferReq },
//         { title: "Buffer Manpower Available", value: latest.bufferRate || 0 },
//       ],
//       // Graphs
//       manpowerTrend: combinedData.map((d) => ({
//         month: d.month,
//         required: d.required,
//         available: d.available,
//       })),
//       attritionTrend: combinedData.map((d) => ({
//         month: d.month,
//         rate: d.attritionRate,
//       })),
//       bufferTrend: combinedData.map((d) => ({
//         month: d.month,
//         rate: d.bufferRate,
//       })),
//       absenteeismTrend: combinedData.map((d) => ({
//         month: d.month,
//         rate: d.absenteeismRate,
//       })),
//       // Right Sidebar Operators Data (Aggregated for the whole selection)
//       pieData: [
//         {
//           browser: "Permanent",
//           available: latest.permCount || 0,
//           fill: "var(--color-chrome)",
//         },
//         {
//           browser: "Temporary",
//           available: latest.tempCount || 0,
//           fill: "var(--color-safari)",
//         },
//       ],
//       operators: [
//         {
//           key: "L1",
//           name: "Level 1",
//           required: latest.details?.l1.req || 0,
//           available: latest.details?.l1.avail || 0,
//         },
//         {
//           key: "L2",
//           name: "Level 2",
//           required: latest.details?.l2.req || 0,
//           available: latest.details?.l2.avail || 0,
//         },
//         {
//           key: "L3",
//           name: "Level 3",
//           required: latest.details?.l3.req || 0,
//           available: latest.details?.l3.avail || 0,
//         },
//         {
//           key: "L4",
//           name: "Level 4",
//           required: latest.details?.l4.req || 0,
//           available: latest.details?.l4.avail || 0,
//         },
//       ],
//     };

//     return NextResponse.json(responsePayload);
//   } catch (error) {
//     console.error("Database Error:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch analytics" },
//       { status: 500 }
//     );
//   } finally {
//     // connection usually handled by pool in modern mysql2 usage,
//     // if simple connection: await conn.end();
//   }
// }


import { NextResponse } from "next/server";
import { createConnection } from "@/lib/db";

// Helper to construct dynamic WHERE clauses and Input Parameters for MSSQL
const buildFilters = (params) => {
  const { startDate, endDate, unit, skill, type } = params;
  let conditions = [];
  let inputs = {}; // Object to store named parameters

  // Date Filter
  if (startDate && endDate) {
    conditions.push("attendance_date BETWEEN @startDate AND @endDate");
    inputs.startDate = startDate;
    inputs.endDate = endDate;
  }

  // Unit Filter
  if (unit && unit !== "ALL") {
    conditions.push("unit = @unit");
    inputs.unit = unit;
  }

  // Skill Filter
  if (skill && skill !== "ALL") {
    const skillMap = {
      "LEVEL-01": "LEVEL-01",
      "LEVEL-02": "LEVEL-02",
      "LEVEL-03": "LEVEL-03",
      "LEVEL-04": "LEVEL-04",
    };
    conditions.push("Designation = @skill");
    inputs.skill = skillMap[skill] || skill;
  }

  // Employment Type Filter
  if (type && type !== "ALL") {
    if (type === "Permanent") {
      conditions.push("contractor = 'Not Applicable'");
    } else {
      conditions.push("(contractor IS NULL OR contractor != 'Not Applicable')");
    }
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  return { whereClause, inputs };
};

// SQL Server uses .NET format strings
const getDateFormat = (periodicity) => {
  switch (periodicity) {
    case "day":
      return "yyyy-MM-dd";
    case "year":
      return "yyyy";
    case "month":
    default:
      return "MMMM"; // Full month name like 'January'
  }
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const startDate =
    searchParams.get("startDate") || new Date().toISOString().split("T")[0];
  const endDate =
    searchParams.get("endDate") || new Date().toISOString().split("T")[0];
  const unit = searchParams.get("unit");
  const skill = searchParams.get("skill");
  const type = searchParams.get("type");
  const periodicity = searchParams.get("periodicity") || "month"; 

  const conn = await createConnection();
  const filters = buildFilters({ startDate, endDate, unit, skill, type });
  const dateFormat = getDateFormat(periodicity);

  try {
    // Prepare the SQL Request object
    const dbRequest = conn.request();

    // Bind all dynamic inputs
    Object.keys(filters.inputs).forEach((key) => {
      dbRequest.input(key, filters.inputs[key]);
    });

    // ---------------------------------------------------------
    // 1. Manpower Availability Trend
    // ---------------------------------------------------------
    // Note: SQL Server requires repeating the FORMAT logic in GROUP BY (cannot group by alias)
    
    const availabilityQuery = `
      SELECT 
        FORMAT(attendance_date, '${dateFormat}') as time_label,
        COUNT(DISTINCT gp_no) as available_count,
        SUM(absent_days) as total_absent,
        SUM(total_days) as total_working_days,
        COUNT(DISTINCT CASE WHEN Designation LIKE '%LEVEL-01%' THEN gp_no END) as l1_avail,
        COUNT(DISTINCT CASE WHEN Designation LIKE '%LEVEL-02%' THEN gp_no END) as l2_avail,
        COUNT(DISTINCT CASE WHEN Designation LIKE '%LEVEL-03%' THEN gp_no END) as l3_avail,
        COUNT(DISTINCT CASE WHEN Designation LIKE '%LEVEL-04%' THEN gp_no END) as l4_avail,
        COUNT(DISTINCT CASE WHEN contractor = 'Not Applicable' THEN gp_no END) as perm_avail,
        COUNT(DISTINCT CASE WHEN (contractor IS NULL OR contractor != 'Not Applicable') THEN gp_no END) as temp_avail
      FROM attendance_data
      ${filters.whereClause}
      GROUP BY FORMAT(attendance_date, '${dateFormat}')
      ORDER BY MIN(attendance_date) ASC
    `;

    // Attrition Raw Data
    const attritionRawQuery = `
        SELECT DISTINCT gp_no, FORMAT(attendance_date, '${dateFormat}') as time_label
        FROM attendance_data
        ${filters.whereClause}
        ORDER BY time_label ASC
    `;

    // Requirement Query
    // We reuse the inputs bound earlier (@startDate, @endDate, @unit)
    // Note: We need to append explicit unit check here if it exists, as the buildFilters logic might not map 1:1 to this table if names differ.
    // However, assuming standard column names match:
    const requirementQuery = `
        SELECT 
            FORMAT(period_end, '${dateFormat}') as time_label,
            SUM(total_operators_required) as required_count,
            SUM(buffer_manpower_required) as buffer_req,
            SUM(l1_required) as l1_req,
            SUM(l2_required) as l2_req,
            SUM(l3_required) as l3_req,
            SUM(l4_required) as l4_req
        FROM manpower_requirement
        WHERE period_end BETWEEN @startDate AND @endDate 
        ${unit && unit !== "ALL" ? "AND unit = @unit" : ""}
        GROUP BY FORMAT(period_end, '${dateFormat}')
    `;

    // Station Query (Snapshot)
    const stationQuery = `
        SELECT SUM(total_stations_required) as total_stations
        FROM stations_requirement 
        WHERE period_start BETWEEN @startDate AND @endDate
        ${unit && unit !== "ALL" ? "AND unit = @unit" : ""}
    `;

    // Execute Queries
    const availResult = await dbRequest.query(availabilityQuery);
    const attritionResult = await dbRequest.query(attritionRawQuery);
    const reqResult = await dbRequest.query(requirementQuery);
    const stationResult = await dbRequest.query(stationQuery);

    const availRows = availResult.recordset;
    const attritionRows = attritionResult.recordset;
    const reqRows = reqResult.recordset;
    const stationRows = stationResult.recordset;

    // ---------------------------------------------------------
    // Process Attrition (Same logic as before)
    // ---------------------------------------------------------
    const employeesByMonth = {};
    attritionRows.forEach((row) => {
      if (!employeesByMonth[row.time_label]) {
        employeesByMonth[row.time_label] = new Set();
      }
      employeesByMonth[row.time_label].add(row.gp_no);
    });

    const timeLabels = Object.keys(employeesByMonth).sort(); 
    const attritionMap = {};

    timeLabels.forEach((currentMonth, index) => {
      const nextMonth = timeLabels[index + 1];
      if (nextMonth) {
        const currentEmployees = employeesByMonth[currentMonth];
        const nextEmployees = employeesByMonth[nextMonth];
        let exits = 0;
        currentEmployees.forEach((emp) => {
          if (!nextEmployees.has(emp)) exits++;
        });
        const headcount = currentEmployees.size;
        const rate = headcount > 0 ? ((exits / headcount) * 100).toFixed(1) : 0;
        attritionMap[currentMonth] = rate;
      } else {
        attritionMap[currentMonth] = 0;
      }
    });

    // ---------------------------------------------------------
    // Merge Data
    // ---------------------------------------------------------
    const combinedData = availRows.map((row) => {
      const reqMatch = reqRows.find((r) => r.time_label === row.time_label) || {};
      const required = Number(reqMatch.required_count || 0);
      const available = Number(row.available_count || 0);
      const bufferReq = Number(reqMatch.buffer_req || 0);

      const bufferAvailable = Math.max(0, available - required);

      const totalDays = Number(row.total_working_days || 1);
      const absentDays = Number(row.total_absent || 0);
      const absenteeismRate = ((absentDays / totalDays) * 100).toFixed(1);

      const attritionRate = Number(attritionMap[row.time_label] || 0);

      return {
        month: row.time_label,
        required: required,
        available: available,
        bufferRate: bufferAvailable,
        absenteeismRate: absenteeismRate,
        attritionRate: attritionRate,
        bufferReq,
        permCount: Number(row.perm_avail || 0),
        tempCount: Number(row.temp_avail || 0),
        details: {
          l1: { req: Number(reqMatch.l1_req || 0), avail: Number(row.l1_avail || 0) },
          l2: { req: Number(reqMatch.l2_req || 0), avail: Number(row.l2_avail || 0) },
          l3: { req: Number(reqMatch.l3_req || 0), avail: Number(row.l3_avail || 0) },
          l4: { req: Number(reqMatch.l4_req || 0), avail: Number(row.l4_avail || 0) },
        },
      };
    });

    const latest = combinedData[combinedData.length - 1] || {};

    // ---------------------------------------------------------
    // Response Payload
    // ---------------------------------------------------------
    const responsePayload = {
      cards: [
        { title: "Total Stations", value: stationRows[0]?.total_stations || 0 },
        { title: "Total Operators Required", value: latest.required || 0 },
        { title: "Total Operators Available", value: latest.available || 0 },
        { title: "Buffer Manpower Required", value: latest.bufferReq || 0 },
        { title: "Buffer Manpower Available", value: latest.bufferRate || 0 },
      ],
      manpowerTrend: combinedData.map((d) => ({
        month: d.month,
        required: d.required,
        available: d.available,
      })),
      attritionTrend: combinedData.map((d) => ({
        month: d.month,
        rate: d.attritionRate,
      })),
      bufferTrend: combinedData.map((d) => ({
        month: d.month,
        rate: d.bufferRate,
      })),
      absenteeismTrend: combinedData.map((d) => ({
        month: d.month,
        rate: d.absenteeismRate,
      })),
      pieData: [
        { browser: "Permanent", available: latest.permCount || 0, fill: "var(--color-chrome)" },
        { browser: "Temporary", available: latest.tempCount || 0, fill: "var(--color-safari)" },
      ],
      operators: [
        { key: "L1", name: "Level 1", required: latest.details?.l1.req || 0, available: latest.details?.l1.avail || 0 },
        { key: "L2", name: "Level 2", required: latest.details?.l2.req || 0, available: latest.details?.l2.avail || 0 },
        { key: "L3", name: "Level 3", required: latest.details?.l3.req || 0, available: latest.details?.l3.avail || 0 },
        { key: "L4", name: "Level 4", required: latest.details?.l4.req || 0, available: latest.details?.l4.avail || 0 },
      ],
    };

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}