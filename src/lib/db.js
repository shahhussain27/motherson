// import mysql from "mysql2/promise";

// let connection;
// export const createConnection = async () => {
//   if (!connection) {
//     connection = await mysql.createConnection({
//       host: process.env.DATABASE_HOST,
//       port: process.env.DATABASE_PORT,
//       user: process.env.DATABASE_USER,
//       password: process.env.DATABASE_PASSWORD,
//       database: process.env.DATABASE_NAME,
//       waitForConnections: true,
//       connectionLimit: 10,
//     });
//   }

//   return connection;
// };


import sql from "mssql";

let pool;

export async function createConnection() {
  if (!pool) {
    pool = await sql.connect({
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      server: process.env.DATABASE_HOST, 
      database: process.env.DATABASE_NAME,
      port: Number(process.env.DATABASE_PORT), 
      options: {
        encrypt: false,
        trustServerCertificate: true,
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    });
  }

  return pool;
}

export { sql };