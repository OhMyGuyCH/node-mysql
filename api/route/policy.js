const express = require("express");
const router = express.Router();
const pool = require("../../dbcon");
const mysql = require("mysql");

//เรียกหมด
router.get("/", (req, res) => {
  pool.query("SELECT * FROM policy WHERE active = 1", (error, results) => {
    if (error) throw error;
    res.status(200).json(results);
  });
});
router.get("/all", (req, res) => {
  pool.query("SELECT * FROM policy", (error, results) => {
    if (error) throw error;
    res.status(200).json(results);
  });
});

//เรียก id
router.get("/id", (req, res) => {
  pool.query(
    "SELECT section_id AND department_id FROM policy WHERE active = 1",
    (error, results) => {
      if (error) throw error;
      res.status(200).json(results);
    }
  );
});

//เรียก 1
// router.get("/:sectionId", (req, res) => {
//   let id = req.params.sectionId;

//   pool.query(
//     "SELECT * FROM section WHERE section_id = '" + id + "' AND active = 1 ",
//     (error, results, fields) => {
//       if (error) throw error;
//       res.status(200).json(results);
//     }
//   );
// });

//เพิ่ม
router.post("/", (req, res) => {
  let data = req.body;
  let sql =
    "INSERT INTO `policy` (`user_id`, `department_id`,`section_id`,`active`) " +
    "VALUES (?, ?,?,?)";
  sql = mysql.format(sql, [
    data.user_id,
    data.department_id,
    data.section_id,
    (data.active = 1),
  ]);

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
router.delete("/:userId/:departmentId/:sectionId", (req, res) => {
  let uid = req.params.userId;
  let did = req.params.departmentId;
  let sid = req.params.sectionId;
  let sql =
    "DELETE FROM policy WHERE user_id = ? AND department_id= ? AND section_id = ?";
  sql = mysql.format(sql, [uid, did, sid]);

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

// Update a section
router.put("/:userId/:departmentId/:sectionId", (req, res) => {
  let uid = req.params.userId;
  let did = req.params.departmentId;
  let sid = req.params.sectionId;
  let data = req.body;
  let sql =
    "UPDATE policy SET ? WHERE user_id = ? AND department_id= ? AND section_id = ?";
  sql = mysql.format(sql, [data, uid, did, sid]);

  pool.query(sql, (error, results, fields) => {
    if (error) throw error;
    if (results.affectedRows == 1) {
      res.status(200).json({
        message: "Update SUCCESS",
      });
    } else {
      res.status(400).json({
        message: "Update FAILED",
      });
    }
  });
});

module.exports = router;
