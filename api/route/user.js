const express = require("express");
const router = express.Router();
const pool = require("../../dbcon");
const mysql = require("mysql");
const mergeJSON = require("merge-json");
const token = require("../../token");

//เรียกหมด
router.get("/", (req, res) => {
  pool.query("SELECT * FROM user", (error, results, fields) => {
    if (error) throw error;
    res.status(200).json(results);
  });
});

//เรียก 1
router.get("/:userid", (req, res) => {
  let id = req.params.userid;

  pool.query(
    "SELECT * FROM user WHERE user_id = '" + id + "' ",
    (error, results, fields) => {
      if (error) throw error;
      res.status(200).json(results);
    }
  );
});

// เพิ่มข้อมูล
router.post("/", (req, res) => {
  let data = req.body; //ข้อมูลเข้า
  let sql =
    "INSERT INTO `user` (`user_id` ,`department_id`, `section_id`,`user_fname`,`user_lname`,`user_login`,`password`,`user_level`)" +
    " VALUES (?,?,?,?,?,?,?,?)"; // นำมาใส่ในตัวแปร sql
  sql = mysql.format(sql, [
    data.user_id,
    data.department_id,
    data.section_id,
    data.user_fname,
    data.user_lname,
    data.user_login,
    data.password,
    data.user_level,
  ]); // แล้วมาจัดข้อมูลในเป็นรูปแบบที่ถูกต้อง

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
    }
  });
});

// ลบข้อมูล
router.delete("/:userid", (req, res) => {
  let id = req.params.userid;
  let sql = "DELETE FROM user WHERE user_id = ?";
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

// อัพเดทข้อมูล
router.put("/:userid", (req, res) => {
  let id = req.params.userid;
  let data = req.body;

  // Query old data
  let oldSql = "SELECT * FROM user WHERE user_id=?";
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
      "UPDATE user set department_id=? , section_id=? , user_fname=? , user_lname=? , user_login=? ,password=? ,user_level=? WHERE user_id=?";
    sql = mysql.format(sql, [
      newdata.department_id,
      newdata.section_id,
      newdata.user_fname,
      newdata.user_lname,
      newdata.user_login,
      newdata.password,
      newdata.user_level,
      newdata.user_id,
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
          message: "Update FAILED",
        });
      }
    });
  });
});

// router.use((req, res, next) => {
//   if (req.headers["authorization"]) {
//     try {
//       const token = req.headers["authorization"].split(" ")[1];
//       const decoded = jwt.verify(token, "secret_key");
//       req.user = decoded;
//     } catch (err) {
//       return res.status(401).json({ error: "Invalid token" });
//     }
//   } else {
//     return res.status(401).json({ error: "Missing token" });
//   }
//   next();
// });

// router.get("/profile", (req, res) => {
//   const userId = req.user.userId;

//   const query = `
//     SELECT * FROM users
//     WHERE user_id = ?
//   `;

//   pool.query(query, [userId], (err, results) => {
//     if (err) {
//       res.status(500).json({ error: err.message });
//     } else if (results.length === 0) {
//       res.status(404).json({ error: "User not found" });
//     } else {
//       const user = results[0];
//       res.status(200).json({ user });
//     }
//   });
// });

router.post("/get_token/:user_id", (req, res) => {
  res.send(token.getAccessToken({ user_id: req.params.user_id }));
});

router.post("/check_authen", (req, res) => {
  let jwtStatus = token.chekAuthentication(req);
  if (jwtStatus != false) {
    res.send(jwtStatus);
  } else {
    res.send("Token Error!!");
  }
});
module.exports = router;
