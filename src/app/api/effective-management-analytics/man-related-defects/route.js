// import { NextResponse } from "next/server";
// import { createConnection } from "@/lib/db";

// export const GET = async (request) => {
//   try {
//     const conn = await createConnection();

//     // Fetch the entries column where data exists
//     const [rows] = await conn.query(
//       "SELECT entries FROM on_job_trainings WHERE entries IS NOT NULL"
//     );

//     const aggregator = {};
//     const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

//     rows.forEach((row) => {
//       let entriesData = [];

//       try {
//         entriesData = JSON.parse(row.entries);
//       } catch (e) {
//         return; 
//       }

//       if (Array.isArray(entriesData)) {
//         entriesData.forEach((entry) => {
//           if (entry.date) {
//             const date = new Date(entry.date);
            
//             if (!isNaN(date)) {
//               const monthIndex = date.getMonth();
//               const year = date.getFullYear();
              
//               const timeLabel = `${monthNames[monthIndex]} ${year}`;
              
//               const sortValue = (year * 100) + monthIndex;

//               const defects = parseInt(entry.rejection, 10) || 0;
//               const complaints = parseInt(entry.customerComplaint, 10) || 0;

//               if (!aggregator[timeLabel]) {
//                 aggregator[timeLabel] = {
//                   month: timeLabel, 
//                   totalDefects: 0,
//                   ctqRejection: 0,
//                   _sortIndex: sortValue 
//                 };
//               }

//               aggregator[timeLabel].totalDefects += defects;
//               aggregator[timeLabel].ctqRejection += complaints;
//             }
//           }
//         });
//       }
//     });

//     // Sort by the Year+Month index
//     const formattedData = Object.values(aggregator)
//       .sort((a, b) => a._sortIndex - b._sortIndex)
//       .map(({ _sortIndex, ...rest }) => rest);

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

    // MSSQL execution
    // Fetch the entries column where data exists
    const result = await conn.request().query(
      "SELECT entries FROM on_job_trainings WHERE entries IS NOT NULL"
    );

    const rows = result.recordset; // Access data here

    const aggregator = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    rows.forEach((row) => {
      let entriesData = [];

      try {
        // Parse JSON string from DB
        entriesData = JSON.parse(row.entries);
      } catch (e) {
        return; 
      }

      if (Array.isArray(entriesData)) {
        entriesData.forEach((entry) => {
          if (entry.date) {
            const date = new Date(entry.date);
            
            if (!isNaN(date)) {
              const monthIndex = date.getMonth();
              const year = date.getFullYear();
              
              const timeLabel = `${monthNames[monthIndex]} ${year}`;
              
              // Create a sort index (e.g., 202301 for Jan 2023) to sort chronologically later
              const sortValue = (year * 100) + monthIndex;

              const defects = parseInt(entry.rejection, 10) || 0;
              const complaints = parseInt(entry.customerComplaint, 10) || 0;

              if (!aggregator[timeLabel]) {
                aggregator[timeLabel] = {
                  month: timeLabel, 
                  totalDefects: 0,
                  ctqRejection: 0,
                  _sortIndex: sortValue 
                };
              }

              aggregator[timeLabel].totalDefects += defects;
              aggregator[timeLabel].ctqRejection += complaints;
            }
          }
        });
      }
    });

    // Sort by the Year+Month index
    const formattedData = Object.values(aggregator)
      .sort((a, b) => a._sortIndex - b._sortIndex)
      .map(({ _sortIndex, ...rest }) => rest);

    return NextResponse.json({ data: formattedData });
  } catch (error) {
    console.error("Error fetching training summary data:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
};