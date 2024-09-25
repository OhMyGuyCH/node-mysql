const express = require("express");
const router = express.Router();
const pool = require("../../dbcon");
const mysql = require("mysql");

//เรียกหมด
router.get("/", (req, res) => {
  pool.query("SELECT * FROM unit", (error, results) => {
    if (error) throw error;
    res.status(200).json(results);
  });
});

//เรียก id
router.get("/id", (req, res) => {
  pool.query("SELECT unit_id FROM unit", (error, results) => {
    if (error) throw error;
    res.status(200).json(results);
  });
});

//เรียก 1
router.get("/:unitID", (req, res) => {
  let id = req.params.unitID;

  pool.query(
    "SELECT * FROM unit WHERE unit_id = '" + id + "' ",
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
    "INSERT INTO `unit` (`unit_id`, `unit_description`) " + "VALUES (?, ?)";
  sql = mysql.format(sql, [data.unit_id, data.unit_description]);

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
router.delete("/:unitID", (req, res) => {
  let id = req.params.unitID;
  let sql = "DELETE FROM unit WHERE unit_id = ?";
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
