const mysql = require("mysql");

const pool = mysql.createPool({
  connectionLimit: 10, //เพิ่ม connection
  host: "192.168.9.175",
  user: "adminmadc",
  password: "",
  database: "stationary",
});

module.exports = pool;
