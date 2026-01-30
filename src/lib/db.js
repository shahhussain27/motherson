import mysql from "mysql2/promise";

let pool;

export const createConnection = async () => {
  // 1. Use a global variable to preserve the pool across hot-reloads in development
  if (process.env.NODE_ENV === "development") {
    if (!global._mysqlPool) {
      global._mysqlPool = mysql.createPool({
        host: process.env.DATABASE_HOST,
        port: process.env.DATABASE_PORT,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });
    }
    pool = global._mysqlPool;
  } else {
    // 2. In production, create the pool if it doesn't exist
    if (!pool) {
      pool = mysql.createPool({
        host: process.env.DATABASE_HOST,
        port: process.env.DATABASE_PORT,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });
    }
  }

  // 3. Return the POOL, not a single connection.
  // The pool allows you to run `await pool.query(...)` just like a connection,
  // but it handles reconnection automatically.
  return pool;
};

// import sql from "mssql";

// let pool;

// export async function createConnection() {
//   if (!pool) {
//     pool = await sql.connect({
//       user: process.env.DATABASE_USER,
//       password: process.env.DATABASE_PASSWORD,
//       server: process.env.DATABASE_HOST,
//       database: process.env.DATABASE_NAME,
//       port: Number(process.env.DATABASE_PORT),
//       options: {
//         encrypt: false,
//         trustServerCertificate: true,
//       },
//       pool: {
//         max: 10,
//         min: 0,
//         idleTimeoutMillis: 30000,
//       },
//     });
//   }

//   return pool;
// }

// export { sql };
