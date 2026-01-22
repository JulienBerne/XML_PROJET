// db.js
import mysql from "mysql2/promise";

export const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Juju1212",
  database: "xml_projet",
  waitForConnections: true,
  connectionLimit: 10
});
