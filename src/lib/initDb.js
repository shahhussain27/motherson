import { createConnection } from "@/lib/db";

export const ensureTables = async () => {
  const conn = await createConnection();

  // 1) attendance_data
  await conn.query(`
    CREATE TABLE IF NOT EXISTS attendance_data (
      id INT AUTO_INCREMENT PRIMARY KEY,
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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_period (period_start, period_end),
      UNIQUE KEY uniq_emp_date (attendance_date, gp_no)
    );
  `);

  // 2) manpower_requirement
  await conn.query(`
    CREATE TABLE IF NOT EXISTS manpower_requirement (
      id INT AUTO_INCREMENT PRIMARY KEY,
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      unit VARCHAR(100),
      total_operators_required INT DEFAULT 0,
      buffer_manpower_required INT DEFAULT 0,
      l1_required INT DEFAULT 0,
      l2_required INT DEFAULT 0,
      l3_required INT DEFAULT 0,
      l4_required INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_manpower_period (period_start, period_end, unit)
    );
  `);

  // 3) stations_requirement
  await conn.query(`
    CREATE TABLE IF NOT EXISTS stations_requirement (
      id INT AUTO_INCREMENT PRIMARY KEY,
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      unit VARCHAR(100),
      total_stations_required INT DEFAULT 0,
      total_ctq_stations_required INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_station_period (period_start, period_end, unit)
    );
  `);

  // 4) ctq_manpower_requirement
  await conn.query(`
    CREATE TABLE IF NOT EXISTS ctq_manpower_requirement (
      id INT AUTO_INCREMENT PRIMARY KEY,
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      unit VARCHAR(100),
      total_ctq_operators_required INT DEFAULT 0,
      buffer_ctq_required INT DEFAULT 0,
      l1_required INT DEFAULT 0,
      l2_required INT DEFAULT 0,
      l3_required INT DEFAULT 0,
      l4_required INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_ctq_period (period_start, period_end, unit)
    );
  `);

  // 5) Users Table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'Read',
      permissions TEXT, -- Storing array as JSON string
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 6) Daily Defects Table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS daily_defects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      defect_date DATE NOT NULL,
      defect_type VARCHAR(100) NOT NULL,
      defect_source VARCHAR(100) NOT NULL,
      skill_level VARCHAR(50) NOT NULL,
      unit VARCHAR(50) NOT NULL,
      gp_no VARCHAR(50) NOT NULL,
      employee_name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
};
