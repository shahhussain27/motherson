import * as XLSX from "xlsx";

const formatDate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDMY = (str) => {
  const [d, m, y] = str.split("/").map(Number);
  return new Date(y, m - 1, d);
};

export function parseAttendanceExcel(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: "",
  });

  // --- 1) Get period from row 3 ("Muster Roll from 26/10/2025 To 25/11/2025")
  const titleRow = rows[2] || [];
  const titleCell = String(titleRow[0] || "").trim();

  const match =
    /Muster Roll from\s+(\d{2}\/\d{2}\/\d{4})\s+To\s+(\d{2}\/\d{2}\/\d{4})/i.exec(
      titleCell
    );

  if (!match) {
    throw new Error("Cannot find 'Muster Roll from ... To ...' on row 3 (A3).");
  }

  const [, fromStr, toStr] = match;
  const periodStartDate = parseDMY(fromStr);
  const periodEndDate = parseDMY(toStr);

  const period_start = formatDate(periodStartDate);
  const period_end = formatDate(periodEndDate);

  const locationRow = rows[4]; // Excel row 5 → index 4
  let unitFromHeader = null;

  if (locationRow) {
    // find any cell containing "PUNE"
    for (const cell of locationRow) {
      if (
        cell &&
        typeof cell === "string" &&
        cell.toUpperCase().includes("PUNE")
      ) {
        unitFromHeader = cell.replace(/\s+/g, ""); // convert "PUNE 3" → "PUNE3"
        break;
      }
    }
  }

  // --- 3) Header row (row 7 -> index 6)
  const headerRowIndex = 6;
  const headerRow = rows[headerRowIndex] || [];

  const headerIndexMap = {};
  headerRow.forEach((val, idx) => {
    if (val !== undefined && val !== null && String(val).trim() !== "") {
      headerIndexMap[String(val).trim()] = idx;
    }
  });

  // Defensive fallback indices for fixed columns
  const getIndex = (keyword) => {
    return headerRow.findIndex(
      (v) =>
        v && v.toString().trim().toLowerCase().includes(keyword.toLowerCase())
    );
  };

  const colIndex = {
    gp_no: getIndex("GP No"),
    name: getIndex("Name"),
    father: getIndex("Husband"),
    unit: getIndex("Unit"),
    skill_type: getIndex("Skill"),
    designation: getIndex("Designation"),
    contractor: getIndex("Contractor"),
    section: getIndex("Section"),
    subSection: getIndex("Sub Section"),
  };

  // --- 3) Day columns 26..31 & 01..25
  const dayColumns = [];
  headerRow.forEach((val, idx) => {
    const label = String(val || "").trim();
    if (/^\d{2}$/.test(label)) {
      const dayNum = Number(label);
      const isFromMonth = dayNum >= 26; // 26-31 => start month; 01-25 => end month

      const baseDate = isFromMonth ? periodStartDate : periodEndDate;
      const date = new Date(
        baseDate.getFullYear(),
        baseDate.getMonth(),
        dayNum
      );

      dayColumns.push({
        index: idx,
        attendance_date: formatDate(date),
      });
    }
  });

  if (dayColumns.length === 0) {
    throw new Error("No day columns (26..31 & 01..25) found in header row.");
  }

  // --- 4) Summary columns (PD, LV, WO, PH, P/PH, OT, PHOT, TOTAL, ABSENT, POW)
  const getIdx = (key) =>
    headerIndexMap[key] === undefined ? null : headerIndexMap[key];

  const idxPD = getIdx("PD");
  const idxLV = getIdx("LV");
  const idxWO = getIdx("WO");
  const idxPH = getIdx("PH");
  const idxPPH = getIdx("P/PH");
  const idxOT = getIdx("OT");
  const idxPHOT = getIdx("PHOT");
  const idxTOTAL = getIdx("TOTAL");
  const idxABSENT = getIdx("ABSENT");
  const idxPOW = getIdx("POW");

  const records = [];
  const startDataRow = headerRowIndex + 1;
  const ALLOWED_DESIGNATIONS = ["LEVEL-01", "LEVEL-02", "LEVEL-03", "LEVEL-04"];

  for (let r = startDataRow; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;

    const gp_no = String(row[colIndex.gp_no] || "").trim();
    const name = String(row[colIndex.name] || "").trim();

    // Skip empty rows or rows without GP No. / Name
    if (!gp_no || !name) continue;
    // Get Designation
    const designation = String(row[colIndex.designation] || "").trim();

    // --- FILTER CHECK ---
    // If the designation is NOT in the allowed list, skip this entire row
    if (!ALLOWED_DESIGNATIONS.includes(designation)) {
      continue;
    }

    const father_or_husband_name = String(row[colIndex.father] || "").trim();
    // const unit = String(row[colIndex.unit] || "").trim();
    const unit = unitFromHeader || String(row[colIndex.unit] || "").trim();
    const skill_type = String(row[colIndex.skill_type] || "").trim();
    // const designation = String(row[colIndex.designation] || "").trim();
    const contractor = String(row[colIndex.contractor] || "").trim();
    const section = String(row[colIndex.section] || "").trim();
    const sub_section = String(row[colIndex.subSection] || "").trim();

    const pd = idxPD != null ? Number(row[idxPD] || 0) : null;
    const lv = idxLV != null ? Number(row[idxLV] || 0) : null;
    const wo = idxWO != null ? Number(row[idxWO] || 0) : null;
    const ph = idxPH != null ? Number(row[idxPH] || 0) : null;
    const p_ph = idxPPH != null ? Number(row[idxPPH] || 0) : null;
    const ot_hours = idxOT != null ? Number(row[idxOT] || 0) : null;
    const phot_hours = idxPHOT != null ? Number(row[idxPHOT] || 0) : null;
    const total_days = idxTOTAL != null ? Number(row[idxTOTAL] || 0) : null;
    const absent_days = idxABSENT != null ? Number(row[idxABSENT] || 0) : null;
    const pow = idxPOW != null ? Number(row[idxPOW] || 0) : null;

    // For every day column, create one record if there is some code
    for (const day of dayColumns) {
      const raw = row[day.index];
      const attendance_code = String(raw || "").trim();

      // If empty, skip (no data for that day)
      if (!attendance_code) continue;

      records.push({
        period_start,
        period_end,
        attendance_date: day.attendance_date,
        gp_no,
        name,
        father_or_husband_name,
        unit,
        skill_type,
        designation,
        contractor,
        section,
        sub_section,
        attendance_code,
        pd,
        lv,
        wo,
        ph,
        p_ph,
        ot_hours,
        phot_hours,
        total_days,
        absent_days,
        pow,
      });
    }
  }

  if (records.length === 0) {
    throw new Error("No attendance rows parsed from Excel.");
  }

  return { period_start, period_end, unitFromHeader, records };
}
