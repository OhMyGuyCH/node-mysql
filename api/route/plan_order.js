const express = require("express");
const router = express.Router();
const pool = require("../../dbcon");
const mysql = require("mysql");
const mergeJSON = require("merge-json");

//เรียกหมด
router.get("/", (req, res) => {
  pool.query("SELECT * FROM plan_order LIMIT 500", (error, results) => {
    if (error) throw error;
    res.status(200).json(results);
  });
});

//เรียก id
router.get("/id", (req, res) => {
  pool.query("SELECT plan_id FROM plan_order LIMIT 500", (error, results) => {
    if (error) throw error;
    res.status(200).json(results);
  });
});

//เรียก 1
router.get("/:planID", (req, res) => {
  let id = req.params.planID;

  pool.query(
    "SELECT * FROM plan_order WHERE plan_id = '" + id + "' LIMIT 500",
    (error, results, fields) => {
      if (error) throw error;
      res.status(200).json(results);
    }
  );
});

//เรียก plan เดือนที่แล้ว
router.get("/month/:month/user/:userId", (req, res) => {
  const userId = req.params.userId;
  let month = req.params.month;
  // Convert month from YYYYMM to YYYY/MM
  if (month.length === 6) {
    month = month.slice(0, 4) + "/" + month.slice(4);
  } else {
    return res.status(400).json({ message: "Invalid month format" });
  }
  // SQL query to fetch plans by month and user ID
  const sql = "SELECT * FROM plan_order WHERE plan_month = ? AND user_id = ?";
  pool.query(sql, [month, userId], (error, results) => {
    if (error) {
      return res.status(500).json({
        message: "Error fetching plans",
        error: error.message,
      });
    }
    res.status(200).json(results);
  });
});

//เพิ่ม
router.post("/", (req, res) => {
  let data = req.body;

  let sql =
    "INSERT INTO `plan_order` (`plan_id`, `user_id` , `section_id` , `department_id`,`plan_month`,`created_date`,`approve_by`,`approve_date`,`plan_status`) " +
    "VALUES (?, ?,?,?,?,CURRENT_TIMESTAMP(),?,?,?)";
  sql = mysql.format(sql, [
    data.plan_id,
    data.user_id,
    data.section_id,
    data.department_id,
    data.plan_month,

    data.approve_by,
    data.approve_date,
    data.plan_status,
  ]);

  pool.query(sql, (error, results, fields) => {
    if (error) {
      res.status(400).json({
        message: "Insert FAILED" + error,
      });
    } else if (results.affectedRows == 1) {
      //affectedRows คือ มีผลกระทบ1แถว
      res.status(201).json({
        message: "Insert SUCCESS",
      });
      console.log(results);
    }
  });
});

// ลบข้อมูล
router.delete("/:itemID", (req, res) => {
  let id = req.params.itemID;
  let sql = "DELETE FROM plan_order WHERE plan_id = ?";
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

//แก้ไข
router.put("/:itemID", (req, res) => {
  let id = req.params.itemID;
  let data = req.body;

  // Query old data
  let oldSql = "SELECT * FROM plan_order WHERE plan_id=?";
  oldSql = mysql.format(oldSql, [id]);
  let jsonoldData = {};
  pool.query(oldSql, (error, results, fields) => {
    let oldData = results[0];
    jsonoldData = JSON.parse(JSON.stringify(oldData));
    // console.log(jsonoldData);

    // Update object data
    let newdata = mergeJSON.merge(jsonoldData, data);
    // console.log(newdata);

    // Save into database
    let sql =
      "UPDATE plan_order set user_id=? , section_id=? , department_id=? ,plan_month=? ,approve_by=? ,approve_date=? ,plan_status=? WHERE plan_id=?";
    sql = mysql.format(sql, [
      newdata.user_id,
      newdata.section_id,
      newdata.department_id,
      newdata.plan_month,

      newdata.approve_by,
      newdata.approve_date,
      newdata.plan_status,
      newdata.plan_id,
    ]);

    pool.query(sql, (error, results, fields) => {
      if (error) throw error;
      if (results.affectedRows == 1) {
        //affectedRows คือ มีผลกระทบ1แถว
        res.status(201).json({
          message: "Update SUCCESS",
        });
      } else {
        res.status(400).json({
          message: "Update FAILED :" + error,
        });
      }
    });
  });
});

// query all
router.get("/query/:year/:month", (req, res) => {
  let year = req.params.year;
  let month = req.params.month;

  const monthid = year + "/" + month;

  if (!year || !month || isNaN(year) || isNaN(month)) {
    return res
      .status(400)
      .json({ error: "Invalid month format. Expected format is YYYY/MM." });
  }

  pool.query(
    `SELECT plan_order.plan_month AS "เดือน",plan_order_line.item_id AS "รหัสสินค้า",
    item.item_name AS "ชื่อสินค้า",plan_order_line.plan_quantity AS "จำนวน",
    plan_order_line.unit_id AS "หน่วย",plan_order.department_id AS "ฝ่าย",
    section.section_name AS "แผนก" 
     FROM plan_order 
     JOIN plan_order_line ON plan_order.plan_id = plan_order_line.plan_id 
     JOIN item ON plan_order_line.item_id = item.item_id 
     JOIN section ON plan_order.section_id = section.section_id 
     WHERE plan_order.plan_month = ? AND (plan_status = 1 OR plan_status = 3)`,
    [monthid],
    (error, results, fields) => {
      if (error) throw error;
      res.status(200).json(results);
    }
  );
});

module.exports = router;
