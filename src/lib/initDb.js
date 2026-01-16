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


import { createConnection } from "@/lib/db";
import bcrypt from "bcryptjs";

export const ensureTables = async () => {
  const conn = await createConnection();

  // 1) attendance_data
  await conn.query(`
    IF OBJECT_ID('dbo.attendance_data', 'U') IS NULL
    BEGIN
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
        created_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT uniq_emp_date UNIQUE (attendance_date, gp_no)
      );
      CREATE INDEX idx_period ON attendance_data (period_start, period_end);
    END
  `);

  // 2) manpower_requirement
  await conn.query(`
    IF OBJECT_ID('dbo.manpower_requirement', 'U') IS NULL
    BEGIN
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
        created_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT uniq_manpower_period UNIQUE (period_start, period_end, unit)
      );
    END
  `);

  // 3) stations_requirement
  await conn.query(`
    IF OBJECT_ID('dbo.stations_requirement', 'U') IS NULL
    BEGIN
      CREATE TABLE stations_requirement (
        id INT IDENTITY(1,1) PRIMARY KEY,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        unit VARCHAR(100),
        total_stations_required INT DEFAULT 0,
        total_ctq_stations_required INT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT uniq_station_period UNIQUE (period_start, period_end, unit)
      );
    END
  `);

  // 4) ctq_manpower_requirement
  await conn.query(`
    IF OBJECT_ID('dbo.ctq_manpower_requirement', 'U') IS NULL
    BEGIN
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
        created_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT uniq_ctq_period UNIQUE (period_start, period_end, unit)
      );
    END
  `);

  // 5) Dashboard Users Table
  await conn.query(`
    IF OBJECT_ID('dbo.dashboard_users', 'U') IS NULL
    BEGIN
      CREATE TABLE dashboard_users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'Read',
        permissions NVARCHAR(MAX), -- Text is deprecated, use NVARCHAR(MAX)
        created_at DATETIME DEFAULT GETDATE()
      );
    END
  `);

  // 6) Daily Defects Table
  await conn.query(`
    IF OBJECT_ID('dbo.daily_defects', 'U') IS NULL
    BEGIN
      CREATE TABLE daily_defects (
        id INT IDENTITY(1,1) PRIMARY KEY,
        defect_date DATE NOT NULL,
        defect_type VARCHAR(100) NOT NULL,
        defect_source VARCHAR(100) NOT NULL,
        skill_level VARCHAR(50) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        gp_no VARCHAR(50) NOT NULL,
        employee_name VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT GETDATE()
      );
    END
  `);

  // 7) Training Plan Table
  await conn.query(`
    IF OBJECT_ID('dbo.training_plan', 'U') IS NULL
    BEGIN
      CREATE TABLE training_plan (
        id INT IDENTITY(1,1) PRIMARY KEY,
        plan_date DATE NOT NULL,
        total_training_plan INT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT uniq_plan_date UNIQUE (plan_date)
      );
    END
  `);

  try {
    // Check if admin already exists
    const result = await conn.query`SELECT id FROM dashboard_users WHERE username = 'admin'`;

    if (result.recordset.length === 0) {
      console.log("Admin user not found. Creating default admin...");

      // Hash the password "admin@123"
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("admin@123", salt);

      // Insert the new admin user
      await conn.request()
        .input("username", "admin")
        .input("password", hashedPassword)
        .input("role", "Admin")
        .input("permissions", '["/allStations","/ctqStations","/effectiveManagement","/dashboardManagement","/dailyDefects","/userManagement"]')
        .query(`INSERT INTO dashboard_users (username, password, role, permissions) VALUES (@username, @password, @role, @permissions)`);

      console.log("Default admin user created successfully.");
    }
  } catch (error) {
    console.error("Error seeding admin user:", error);
  }
};