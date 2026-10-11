import mysql2 from "mysql2/promise";

const db = mysql2.createPool({
  host:               "localhost",
  user:               "root",
  password:           "Android123",
  database:           "project101",
  port:               3306,
  waitForConnections: true,
  connectionLimit:    10,
});

export default db;