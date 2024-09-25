//login.js
const express = require("express");
const router = express.Router();
const pool = require("../../dbcon");
const token = require("../../token");

router.post("/", (req, res) => {
  const { username, password } = req.body;

  const query = `
    SELECT * FROM user
    WHERE user_login = ? AND password = ?
  `;

  pool.query(query, [username, password], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (results.length === 0) {
      res.status(401).json({ error: "Invalid username or password" });
    } else {
      const user = results[0];
      let accessToken = token.getAccessToken({ user_id: user.user_login }); // ใช้ user.user_login หรือค่าที่เหมาะสมจากการ query

      // console.log(user);
      res.status(200).json({ user, accessToken });
    }
  });
});

//เรียก user Level
router.get("/:userid", (req, res) => {
  let id = req.params.userid;

  pool.query(
    "SELECT user_level,user_id FROM user WHERE user_login = '" + id + "' ",
    (error, results, fields) => {
      const user_level = results;
      if (error) throw error;
      res.status(200).json(results);
    }
  );
});
//เรียก user_id
router.get("/ID/:userid", (req, res) => {
  let id = req.params.userid;

  pool.query(
    "SELECT user_id FROM user WHERE user_login = '" + id + "' ",
    (error, results, fields) => {
      if (error) throw error;
      res.status(200).json(results);
    }
  );
});
module.exports = router;
