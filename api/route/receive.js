const express = require("express");
const router = express.Router();
const pool = require("../../dbcon");
const mysql = require("mysql");
const mergeJSON = require("merge-json");

//เรียกหมด
router.get("/", (req, res) => {
  pool.query("SELECT * FROM receive_order LIMIT 500", (error, results) => {
    if (error) throw error;
    res.status(200).json(results);
  });
});

//เรียก id
router.get("/id", (req, res) => {
  pool.query(
    "SELECT receive_id FROM receive_order LIMIT 500",
    (error, results) => {
      if (error) throw error;
      res.status(200).json(results);
    }
  );
});

//เรียก 1
router.get("/:receiveID", (req, res) => {
  let id = req.params.receiveID;

  pool.query(
    "SELECT * FROM receive_order WHERE receive_id = '" + id + "' ",
    (error, results, fields) => {
      if (error) throw error;
      res.status(200).json(results);
    }
  );
});

// //เรียก plan เดือนที่แล้ว
// router.get("/month/:month/user/:userId", (req, res) => {
//   const userId = req.params.userId;
//   let month = req.params.month;
//   // Convert month from YYYYMM to YYYY/MM
//   if (month.length === 6) {
//     month = month.slice(0, 4) + "/" + month.slice(4);
//   } else {
//     return res.status(400).json({ message: "Invalid month format" });
//   }
//   // SQL query to fetch plans by month and user ID
//   const sql = "SELECT * FROM plan_order WHERE plan_month = ? AND user_id = ?";
//   pool.query(sql, [month, userId], (error, results) => {
//     if (error) {
//       return res.status(500).json({
//         message: "Error fetching plans",
//         error: error.message,
//       });
//     }
//     res.status(200).json(results);
//   });
// });

//เพิ่ม
router.post("/", (req, res) => {
  let data = req.body;

  let sql =
    "INSERT INTO `receive_order` (`receive_id` , `user_id` , `receive_date`) " +
    "VALUES (?,?,CURRENT_TIMESTAMP())";
  sql = mysql.format(sql, [data.receive_id, data.user_id]);

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
  let sql = "DELETE FROM receive_order WHERE receive_id = ?";
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
router.put("/:receiveID", (req, res) => {
  let id = req.params.itemID;
  let data = req.body;

  // Query old data
  let oldSql = "SELECT * FROM receive_order WHERE receive_id=?";
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
    let sql = "UPDATE receive_order set user_id=? WHERE plan_id=?";
    sql = mysql.format(sql, [newdata.user_id, newdata.receive_id]);

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

module.exports = router;
