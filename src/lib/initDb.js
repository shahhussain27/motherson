// import { createConnection } from "@/lib/db";
// import bcrypt from "bcryptjs";

// export const ensureTables = async () => {
//   const conn = await createConnection();

//   // 1) attendance_data
//   await conn.query(`
//     CREATE TABLE IF NOT EXISTS attendance_data (
//       id INT AUTO_INCREMENT PRIMARY KEY,
//       period_start DATE NOT NULL,
//       period_end DATE NOT NULL,
//       attendance_date DATE NOT NULL,
//       gp_no VARCHAR(50) NOT NULL,
//       name VARCHAR(255) NOT NULL,
//       father_or_husband_name VARCHAR(255),
//       unit VARCHAR(100),
//       skill_type VARCHAR(100),
//       designation VARCHAR(100),
//       contractor VARCHAR(255),
//       section VARCHAR(255),
//       sub_section VARCHAR(255),
//       attendance_code VARCHAR(10),
//       pd INT,
//       lv INT,
//       wo INT,
//       ph INT,
//       p_ph INT,
//       ot_hours DECIMAL(8,2),
//       phot_hours DECIMAL(8,2),
//       total_days INT,
//       absent_days INT,
//       pow INT,
//       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//       INDEX idx_period (period_start, period_end),
//       UNIQUE KEY uniq_emp_date (attendance_date, gp_no)
//     );
//   `);

//   // 2) manpower_requirement
//   await conn.query(`
//     CREATE TABLE IF NOT EXISTS manpower_requirement (
//       id INT AUTO_INCREMENT PRIMARY KEY,
//       period_start DATE NOT NULL,
//       period_end DATE NOT NULL,
//       unit VARCHAR(100),
//       total_operators_required INT DEFAULT 0,
//       buffer_manpower_required INT DEFAULT 0,
//       l1_required INT DEFAULT 0,
//       l2_required INT DEFAULT 0,
//       l3_required INT DEFAULT 0,
//       l4_required INT DEFAULT 0,
//       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//       UNIQUE KEY uniq_manpower_period (period_start, period_end, unit)
//     );
//   `);

//   // 3) stations_requirement
//   await conn.query(`
//     CREATE TABLE IF NOT EXISTS stations_requirement (
//       id INT AUTO_INCREMENT PRIMARY KEY,
//       period_start DATE NOT NULL,
//       period_end DATE NOT NULL,
//       unit VARCHAR(100),
//       total_stations_required INT DEFAULT 0,
//       total_ctq_stations_required INT DEFAULT 0,
//       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//       UNIQUE KEY uniq_station_period (period_start, period_end, unit)
//     );
//   `);

//   // 4) ctq_manpower_requirement
//   await conn.query(`
//     CREATE TABLE IF NOT EXISTS ctq_manpower_requirement (
//       id INT AUTO_INCREMENT PRIMARY KEY,
//       period_start DATE NOT NULL,
//       period_end DATE NOT NULL,
//       unit VARCHAR(100),
//       total_ctq_operators_required INT DEFAULT 0,
//       buffer_ctq_required INT DEFAULT 0,
//       l1_required INT DEFAULT 0,
//       l2_required INT DEFAULT 0,
//       l3_required INT DEFAULT 0,
//       l4_required INT DEFAULT 0,
//       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//       UNIQUE KEY uniq_ctq_period (period_start, period_end, unit)
//     );
//   `);

//   // 5) Dashboard Users Table
//   await conn.query(`
//     CREATE TABLE IF NOT EXISTS dashboard_users (
//       id INT AUTO_INCREMENT PRIMARY KEY,
//       username VARCHAR(255) NOT NULL UNIQUE,
//       password VARCHAR(255) NOT NULL,
//       role VARCHAR(50) NOT NULL DEFAULT 'Read',
//       permissions TEXT, -- Storing array as JSON string
//       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//     );
//   `);

//   // 6) Daily Defects Table
//   await conn.query(`
//     CREATE TABLE IF NOT EXISTS daily_defects (
//       id INT AUTO_INCREMENT PRIMARY KEY,
//       defect_date DATE NOT NULL,
//       defect_type VARCHAR(100) NOT NULL,
//       defect_source VARCHAR(100) NOT NULL,
//       skill_level VARCHAR(50) NOT NULL,
//       unit VARCHAR(50) NOT NULL,
//       gp_no VARCHAR(50) NOT NULL,
//       employee_name VARCHAR(255) NOT NULL,
//       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//     );
//   `);

//   // 7) Training Plan Table
//   await conn.query(`
//     CREATE TABLE IF NOT EXISTS training_plan (
//       id INT AUTO_INCREMENT PRIMARY KEY,
//       plan_date DATE NOT NULL,
//       total_training_plan INT DEFAULT 0,
//       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//       UNIQUE KEY uniq_plan_date (plan_date)
//     );
//   `);

//   try {
//     // Check if admin already exists
//     const [existingUsers] = await conn.query(
//       "SELECT id FROM dashboard_users WHERE username = ?",
//       ["admin"]
//     );

//     if (existingUsers.length === 0) {
//       console.log("Admin user not found. Creating default admin...");

//       // Hash the password "admin@123"
//       const salt = await bcrypt.genSalt(10);
//       const hashedPassword = await bcrypt.hash("admin@123", salt);

//       // Insert the new admin user
//       await conn.query(
//         `INSERT INTO dashboard_users (username, password, role, permissions) VALUES (?, ?, ?, ?)`,
//         [
//           "admin",
//           hashedPassword,
//           "Admin",
//           '["/allStations","/ctqStations","/effectiveManagement","/dashboardManagement","/dailyDefects","/userManagement"]',
//         ]
//       );

//       console.log("Default admin user created successfully.");
//     }
//   } catch (error) {
//     console.error("Error seeding admin user:", error);
//   }
// };


import { createConnection, sql } from "@/lib/db";
import bcrypt from "bcryptjs";

export const ensureTables = async () => {
  const pool = await createConnection();

  // ---------- attendance_data ----------
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'attendance_data')
    CREATE TABLE attendance_data (
      id INT IDENTITY(1,1) PRIMARY KEY,
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      attendance_date DATE NOT NULL,
      gp_no VARCHAR(50) NOT NULL,
      name VARCHAR(255) NOT NULL,
      father_or_husband_name VARCHAR(255),
      unit VARCHAR(100),
      skill_type VARCHAR(100),
      designation VARCHAR(100),
      contractor VARCHAR(255),
      section VARCHAR(255),
      sub_section VARCHAR(255),
      attendance_code VARCHAR(10),
      pd INT,
      lv INT,
      wo INT,
      ph INT,
      p_ph INT,
      ot_hours DECIMAL(8,2),
      phot_hours DECIMAL(8,2),
      total_days INT,
      absent_days INT,
      pow INT,
      created_at DATETIME2 DEFAULT SYSDATETIME(),
      CONSTRAINT uq_attendance UNIQUE (attendance_date, gp_no)
    );
  `);

  // ---------- manpower_requirement ----------
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'manpower_requirement')
    CREATE TABLE manpower_requirement (
      id INT IDENTITY(1,1) PRIMARY KEY,
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      unit VARCHAR(100),
      total_operators_required INT DEFAULT 0,
      buffer_manpower_required INT DEFAULT 0,
      l1_required INT DEFAULT 0,
      l2_required INT DEFAULT 0,
      l3_required INT DEFAULT 0,
      l4_required INT DEFAULT 0,
      created_at DATETIME2 DEFAULT SYSDATETIME(),
      CONSTRAINT uq_manpower UNIQUE (period_start, period_end, unit)
    );
  `);

  // ---------- stations_requirement ----------
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'stations_requirement')
    CREATE TABLE stations_requirement (
      id INT IDENTITY(1,1) PRIMARY KEY,
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      unit VARCHAR(100),
      total_stations_required INT DEFAULT 0,
      total_ctq_stations_required INT DEFAULT 0,
      created_at DATETIME2 DEFAULT SYSDATETIME(),
      CONSTRAINT uq_station UNIQUE (period_start, period_end, unit)
    );
  `);

  // ---------- ctq_manpower_requirement ----------
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ctq_manpower_requirement')
    CREATE TABLE ctq_manpower_requirement (
      id INT IDENTITY(1,1) PRIMARY KEY,
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      unit VARCHAR(100),
      total_ctq_operators_required INT DEFAULT 0,
      buffer_ctq_required INT DEFAULT 0,
      l1_required INT DEFAULT 0,
      l2_required INT DEFAULT 0,
      l3_required INT DEFAULT 0,
      l4_required INT DEFAULT 0,
      created_at DATETIME2 DEFAULT SYSDATETIME(),
      CONSTRAINT uq_ctq UNIQUE (period_start, period_end, unit)
    );
  `);

  // ---------- dashboard_users ----------
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'dashboard_users')
    CREATE TABLE dashboard_users (
      id INT IDENTITY(1,1) PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'Read',
      permissions NVARCHAR(MAX),
      created_at DATETIME2 DEFAULT SYSDATETIME()
    );
  `);

  // ---------- daily_defects ----------
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'daily_defects')
    CREATE TABLE daily_defects (
      id INT IDENTITY(1,1) PRIMARY KEY,
      defect_date DATE NOT NULL,
      defect_type VARCHAR(100) NOT NULL,
      defect_source VARCHAR(100) NOT NULL,
      skill_level VARCHAR(50) NOT NULL,
      unit VARCHAR(50) NOT NULL,
      gp_no VARCHAR(50) NOT NULL,
      employee_name VARCHAR(255) NOT NULL,
      created_at DATETIME2 DEFAULT SYSDATETIME()
    );
  `);

  // ---------- training_plan ----------
  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'training_plan')
    CREATE TABLE training_plan (
      id INT IDENTITY(1,1) PRIMARY KEY,
      plan_date DATE NOT NULL UNIQUE,
      total_training_plan INT DEFAULT 0,
      created_at DATETIME2 DEFAULT SYSDATETIME()
    );
  `);

  // ---------- seed admin ----------
  const result = await pool
    .request()
    .input("username", sql.VarChar, "admin")
    .query("SELECT id FROM dashboard_users WHERE username = @username");

  if (result.recordset.length === 0) {
    const hashedPassword = await bcrypt.hash("admin@123", 10);

    await pool
      .request()
      .input("username", sql.VarChar, "admin")
      .input("password", sql.VarChar, hashedPassword)
      .input("role", sql.VarChar, "Admin")
      .input(
        "permissions",
        sql.NVarChar,
        JSON.stringify([
          "/allStations",
          "/ctqStations",
          "/effectiveManagement",
          "/dashboardManagement",
          "/dailyDefects",
          "/userManagement",
        ])
      )
      .query(`
        INSERT INTO dashboard_users (username, password, role, permissions)
        VALUES (@username, @password, @role, @permissions)
      `);

    console.log("Default admin user created");
  }
};
