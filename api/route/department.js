const express = require("express");
const router = express.Router();
const pool = require("../../dbcon");
const mysql = require("mysql");

//เรียกหมด
router.get("/", (req, res) => {
  pool.query("SELECT * FROM department", (error, results) => {
    if (error) throw error;
    res.status(200).json(results);
  });
});

//เรียก id
router.get("/id", (req, res) => {
  pool.query("SELECT department_id FROM department", (error, results) => {
    if (error) throw error;
    res.status(200).json(results);
  });
});

//เรียก 1
router.get("/:departmentId", (req, res) => {
  let id = req.params.departmentId;

  pool.query(
    "SELECT * FROM department WHERE department_id = '" + id + "' ",
    (error, results, fields) => {
      if (error) throw error;
      res.status(200).json(results);
    }
  );
});

//เพิ่ม
router.post("/", (req, res) => {
  let data = req.body;
  let sql =
    "INSERT INTO `department` (`department_id`, `department_name`) " +
    "VALUES (?, ?)";
  sql = mysql.format(sql, [data.department_id, data.department_name]);

  pool.query(sql, (error, results, fields) => {
    if (error) throw error;
    if (results.affectedRows == 1) {
      res.status(201).json({
        message: "Insert Success",
      });
    } else {
      res.status(400).json({
        message: "Insert Failed",
      });
    }
  });
});

// ลบข้อมูล
router.delete("/:departmentId", (req, res) => {
  let id = req.params.departmentId;
  let sql = "DELETE FROM department WHERE department_id = ?";
  sql = mysql.format(sql, [id]);

  pool.query(sql, (error, results, fields) => {
    if (error) throw error;
    if (results.affectedRows == 1) {
      //affectedRows คือ มีผลกระทบ1แถว
      res.status(201).json({
        message: "Delete SUCCESS",
      });
    } else {
      res.status(400).json({
        message: "Delete FAILED",
      });
    }
  });
});

module.exports = router;
