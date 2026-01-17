// db.js
import mysql from "mysql2/promise";

export const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "22012004T",
  database: "cinema_db",
  waitForConnections: true,
  connectionLimit: 10
});
