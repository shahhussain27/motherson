import { NextResponse } from "next/server";
import { createConnection } from "@/lib/db";

// Helper to construct dynamic WHERE clauses and Date Grouping
const buildFilters = (params) => {
  const { startDate, endDate, unit, skill, type } = params;
  let conditions = [];
  let values = [];

  // Date Filter
  if (startDate && endDate) {
    conditions.push("attendance_date BETWEEN ? AND ?");
    values.push(startDate, endDate);
  }

  // Unit Filter
  if (unit && unit !== "ALL") {
    conditions.push("unit = ?");
    values.push(unit);
  }

  // --- CHANGE 1: PERMANENTLY EXCLUDE LEVEL-01 FROM ATTENDANCE DATA ---
  conditions.push("Designation NOT LIKE '%LEVEL-01%'");

  // Skill Filter (Mapped to skill_type in DB)
  if (skill && skill !== "ALL") {
    const skillMap = {
      // "LEVEL-01": "LEVEL-01", // Removed from map
      "LEVEL-02": "LEVEL-02",
      "LEVEL-03": "LEVEL-03",
      "LEVEL-04": "LEVEL-04",
    };

    conditions.push("Designation = ?");
    values.push(skillMap[skill] || skill);
  }

  // Employment Type Filter
  if (type && type !== "ALL") {
    if (type === "Permanent") {
      conditions.push("contractor = ?");
      values.push("Not Applicable");
    } else {
      conditions.push("(contractor IS NULL OR contractor != ?)");
      values.push("Not Applicable");
    }
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  return { whereClause, values };
};

const getDateFormat = (periodicity) => {
  switch (periodicity) {
    case "day":
      return "%Y-%m-%d";
    case "year":
      return "%Y";
    case "month":
    default:
      return "%M"; 
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
    // ---------------------------------------------------------
    // 1. Manpower Availability Trend (Available vs Required)
    // ---------------------------------------------------------

    const availabilityQuery = `
      SELECT 
        DATE_FORMAT(attendance_date, '${dateFormat}') as time_label,
        COUNT(DISTINCT gp_no) as available_count,
        SUM(absent_days) as total_absent,
        SUM(total_days) as total_working_days,
        -- CHANGE 2: Removed l1_avail calculation
        COUNT(DISTINCT CASE WHEN Designation LIKE '%LEVEL-02%' THEN gp_no END) as l2_avail,
        COUNT(DISTINCT CASE WHEN Designation LIKE '%LEVEL-03%' THEN gp_no END) as l3_avail,
        COUNT(DISTINCT CASE WHEN Designation LIKE '%LEVEL-04%' THEN gp_no END) as l4_avail,
        COUNT(DISTINCT CASE WHEN contractor = 'Not Applicable' THEN gp_no END) as perm_avail,
        COUNT(DISTINCT CASE WHEN (contractor IS NULL OR contractor != 'Not Applicable') THEN gp_no END) as temp_avail
      FROM attendance_data
      ${filters.whereClause}
      GROUP BY time_label
      ORDER BY MIN(attendance_date) ASC
    `;

    // Attrition Logic Query
    const attritionRawQuery = `
        SELECT DISTINCT gp_no, DATE_FORMAT(attendance_date, '${dateFormat}') as time_label
        FROM attendance_data
        ${filters.whereClause}
        ORDER BY attendance_date ASC
    `;

    // Requirement Query
    // CHANGE 3: Subtract l1_required from the total sum and remove l1_req column
    const requirementQuery = `
        SELECT 
            DATE_FORMAT(period_end, '${dateFormat}') as time_label,
            SUM(total_ctq_operators_required) as required_count, 
            SUM(buffer_ctq_required) as buffer_req,
            SUM(l2_required) as l2_req,
            SUM(l3_required) as l3_req,
            SUM(l4_required) as l4_req
        FROM ctq_manpower_requirement
        WHERE period_end BETWEEN ? AND ? 
        ${unit && unit !== "ALL" ? "AND unit = ?" : ""}
        GROUP BY time_label
    `;

    const [availRows] = await conn.query(availabilityQuery, filters.values);
    const [attritionRows] = await conn.query(attritionRawQuery, filters.values);

    const reqValues = [startDate, endDate];
    if (unit && unit !== "ALL") reqValues.push(unit);
    const [reqRows] = await conn.query(requirementQuery, reqValues);

    // ---------------------------------------------------------
    // Process Attrition
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
          if (!nextEmployees.has(emp)) {
            exits++;
          }
        });
        const headcount = currentEmployees.size;
        const rate = headcount > 0 ? ((exits / headcount) * 100).toFixed(1) : 0;
        attritionMap[currentMonth] = rate;
      } else {
        attritionMap[currentMonth] = 0;
      }
    });

    // Merge Data for Trends
    const combinedData = availRows.map((row) => {
      const reqMatch =
        reqRows.find((r) => r.time_label === row.time_label) || {};
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
          // CHANGE 4: Removed L1 Detail Object
          l2: {
            req: Number(reqMatch.l2_req || 0),
            avail: Number(row.l2_avail || 0),
          },
          l3: {
            req: Number(reqMatch.l3_req || 0),
            avail: Number(row.l3_avail || 0),
          },
          l4: {
            req: Number(reqMatch.l4_req || 0),
            avail: Number(row.l4_avail || 0),
          },
        },
      };
    });

    // ---------------------------------------------------------
    // 2. Aggregate Totals for Top Cards
    // ---------------------------------------------------------
    const [stationRows] = await conn.query(
      `
        SELECT SUM(total_ctq_stations_required) as total_stations
        FROM stations_requirement 
        WHERE period_start BETWEEN ? AND ?
        ${unit && unit !== "ALL" ? "AND unit = ?" : ""}
    `,
      reqValues
    );

    const latest = combinedData[combinedData.length - 1] || {};

    const responsePayload = {
      cards: [
        { title: "Total Stations", value: stationRows[0]?.total_stations || 0 },
        { title: "Total Operators Required", value: latest.required || 0 },
        { title: "Total Operators Available", value: latest.available || 0 },
        { title: "Buffer Manpower Required", value: latest.bufferReq },
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
        {
          browser: "Permanent",
          available: latest.permCount || 0,
          fill: "var(--color-chrome)",
        },
        {
          browser: "Temporary",
          available: latest.tempCount || 0,
          fill: "var(--color-safari)",
        },
      ],
      operators: [
        {
          key: "L1",
          name: "Level 1",
          required: 0,
          available: 0,
        },
        {
          key: "L2",
          name: "Level 2",
          required: latest.details?.l2.req || 0,
          available: latest.details?.l2.avail || 0,
        },
        {
          key: "L3",
          name: "Level 3",
          required: latest.details?.l3.req || 0,
          available: latest.details?.l3.avail || 0,
        },
        {
          key: "L4",
          name: "Level 4",
          required: latest.details?.l4.req || 0,
          available: latest.details?.l4.avail || 0,
        },
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

// import { NextResponse } from "next/server";
// import { createConnection } from "@/lib/db";

// // Helper to construct dynamic WHERE clauses and Input Parameters for MSSQL
// const buildFilters = (params) => {
//   const { startDate, endDate, unit, skill, type } = params;
//   let conditions = [];
//   let inputs = {}; // Object to store named parameters

//   // Date Filter
//   if (startDate && endDate) {
//     conditions.push("attendance_date BETWEEN @startDate AND @endDate");
//     inputs.startDate = startDate;
//     inputs.endDate = endDate;
//   }

//   // Unit Filter
//   if (unit && unit !== "ALL") {
//     conditions.push("unit = @unit");
//     inputs.unit = unit;
//   }

//   // --- CHANGE 1: PERMANENTLY EXCLUDE LEVEL-01 FROM ATTENDANCE DATA ---
//   conditions.push("Designation NOT LIKE '%LEVEL-01%'");

//   // Skill Filter
//   if (skill && skill !== "ALL") {
//     const skillMap = {
//       // "LEVEL-01": "LEVEL-01", // Removed from map
//       "LEVEL-02": "LEVEL-02",
//       "LEVEL-03": "LEVEL-03",
//       "LEVEL-04": "LEVEL-04",
//     };
//     conditions.push("Designation = @skill");
//     inputs.skill = skillMap[skill] || skill;
//   }

//   // Employment Type Filter
//   if (type && type !== "ALL") {
//     if (type === "Permanent") {
//       conditions.push("contractor = 'Not Applicable'");
//     } else {
//       conditions.push("(contractor IS NULL OR contractor != 'Not Applicable')");
//     }
//   }

//   const whereClause =
//     conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

//   return { whereClause, inputs };
// };

// // SQL Server uses .NET format strings
// const getDateFormat = (periodicity) => {
//   switch (periodicity) {
//     case "day":
//       return "yyyy-MM-dd";
//     case "year":
//       return "yyyy";
//     case "month":
//     default:
//       return "MMMM"; // Full month name like 'January'
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
//   const periodicity = searchParams.get("periodicity") || "month";

//   const conn = await createConnection();
//   const filters = buildFilters({ startDate, endDate, unit, skill, type });
//   const dateFormat = getDateFormat(periodicity);

//   try {
//     // Prepare the SQL Request object
//     const dbRequest = conn.request();

//     // Bind all dynamic inputs
//     Object.keys(filters.inputs).forEach((key) => {
//       dbRequest.input(key, filters.inputs[key]);
//     });

//     // ---------------------------------------------------------
//     // 1. Manpower Availability Trend
//     // ---------------------------------------------------------
//     // SQL Server requires repeating the FORMAT logic in GROUP BY

//     const availabilityQuery = `
//       SELECT 
//         FORMAT(attendance_date, '${dateFormat}') as time_label,
//         COUNT(DISTINCT gp_no) as available_count,
//         SUM(absent_days) as total_absent,
//         SUM(total_days) as total_working_days,
//         -- CHANGE 2: Removed l1_avail calculation
//         COUNT(DISTINCT CASE WHEN Designation LIKE '%LEVEL-02%' THEN gp_no END) as l2_avail,
//         COUNT(DISTINCT CASE WHEN Designation LIKE '%LEVEL-03%' THEN gp_no END) as l3_avail,
//         COUNT(DISTINCT CASE WHEN Designation LIKE '%LEVEL-04%' THEN gp_no END) as l4_avail,
//         COUNT(DISTINCT CASE WHEN contractor = 'Not Applicable' THEN gp_no END) as perm_avail,
//         COUNT(DISTINCT CASE WHEN (contractor IS NULL OR contractor != 'Not Applicable') THEN gp_no END) as temp_avail
//       FROM attendance_data
//       ${filters.whereClause}
//       GROUP BY FORMAT(attendance_date, '${dateFormat}')
//       ORDER BY MIN(attendance_date) ASC
//     `;

//     // Attrition Logic Query
//     const attritionRawQuery = `
//         SELECT DISTINCT gp_no, FORMAT(attendance_date, '${dateFormat}') as time_label
//         FROM attendance_data
//         ${filters.whereClause}
//         ORDER BY time_label ASC
//     `;

//     // Requirement Query (Targeting ctq_manpower_requirement)
//     // CHANGE 3: Subtract l1_required from the total sum and remove l1_req column
//     // We reuse @startDate, @endDate, @unit bound earlier
//     const requirementQuery = `
//         SELECT 
//             FORMAT(period_end, '${dateFormat}') as time_label,
//             SUM(total_ctq_operators_required) as required_count, 
//             SUM(buffer_ctq_required) as buffer_req,
//             SUM(l2_required) as l2_req,
//             SUM(l3_required) as l3_req,
//             SUM(l4_required) as l4_req
//         FROM ctq_manpower_requirement
//         WHERE period_end BETWEEN @startDate AND @endDate 
//         ${unit && unit !== "ALL" ? "AND unit = @unit" : ""}
//         GROUP BY FORMAT(period_end, '${dateFormat}')
//     `;

//     // Station Query (Targeting total_ctq_stations_required)
//     const stationQuery = `
//         SELECT SUM(total_ctq_stations_required) as total_stations
//         FROM stations_requirement 
//         WHERE period_start BETWEEN @startDate AND @endDate
//         ${unit && unit !== "ALL" ? "AND unit = @unit" : ""}
//     `;

//     // Execute Queries
//     const availResult = await dbRequest.query(availabilityQuery);
//     const attritionResult = await dbRequest.query(attritionRawQuery);
//     const reqResult = await dbRequest.query(requirementQuery);
//     const stationResult = await dbRequest.query(stationQuery);

//     const availRows = availResult.recordset;
//     const attritionRows = attritionResult.recordset;
//     const reqRows = reqResult.recordset;
//     const stationRows = stationResult.recordset;

//     // ---------------------------------------------------------
//     // Process Attrition
//     // ---------------------------------------------------------
//     const employeesByMonth = {};
//     attritionRows.forEach((row) => {
//       if (!employeesByMonth[row.time_label]) {
//         employeesByMonth[row.time_label] = new Set();
//       }
//       employeesByMonth[row.time_label].add(row.gp_no);
//     });

//     const timeLabels = Object.keys(employeesByMonth).sort();
//     const attritionMap = {};

//     timeLabels.forEach((currentMonth, index) => {
//       const nextMonth = timeLabels[index + 1];
//       if (nextMonth) {
//         const currentEmployees = employeesByMonth[currentMonth];
//         const nextEmployees = employeesByMonth[nextMonth];
//         let exits = 0;
//         currentEmployees.forEach((emp) => {
//           if (!nextEmployees.has(emp)) {
//             exits++;
//           }
//         });
//         const headcount = currentEmployees.size;
//         const rate = headcount > 0 ? ((exits / headcount) * 100).toFixed(1) : 0;
//         attritionMap[currentMonth] = rate;
//       } else {
//         attritionMap[currentMonth] = 0;
//       }
//     });

//     // ---------------------------------------------------------
//     // Merge Data for Trends
//     // ---------------------------------------------------------
//     const combinedData = availRows.map((row) => {
//       const reqMatch =
//         reqRows.find((r) => r.time_label === row.time_label) || {};
//       const required = Number(reqMatch.required_count || 0);
//       const available = Number(row.available_count || 0);
//       const bufferReq = Number(reqMatch.buffer_req || 0);

//       const bufferAvailable = Math.max(0, available - required);

//       const totalDays = Number(row.total_working_days || 1);
//       const absentDays = Number(row.total_absent || 0);
//       const absenteeismRate = ((absentDays / totalDays) * 100).toFixed(1);

//       const attritionRate = Number(attritionMap[row.time_label] || 0);

//       return {
//         month: row.time_label,
//         required: required,
//         available: available,
//         bufferRate: bufferAvailable,
//         absenteeismRate: absenteeismRate,
//         attritionRate: attritionRate,
//         bufferReq,
//         permCount: Number(row.perm_avail || 0),
//         tempCount: Number(row.temp_avail || 0),
//         details: {
//           // CHANGE 4: Removed L1 Detail Object
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
//     // 2. Aggregate Totals for Top Cards
//     // ---------------------------------------------------------
//     const latest = combinedData[combinedData.length - 1] || {};

//     const responsePayload = {
//       cards: [
//         { title: "Total Stations", value: stationRows[0]?.total_stations || 0 },
//         { title: "Total Operators Required", value: latest.required || 0 },
//         { title: "Total Operators Available", value: latest.available || 0 },
//         { title: "Buffer Manpower Required", value: latest.bufferReq || 0 },
//         { title: "Buffer Manpower Available", value: latest.bufferRate || 0 },
//       ],
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
//           required: 0,
//           available: 0,
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
//   }
// }