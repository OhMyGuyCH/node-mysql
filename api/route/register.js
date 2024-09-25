const express = require("express");
const router = express.Router();
const pool = require("../../dbcon");

router.post("/", (req, res) => {
  const {
    user_id,
    department_id,
    section_id,
    user_fname,
    user_lname,
    user_login,
    password,
    user_level,
  } = req.body;

  const query = `
    INSERT INTO user (
      user_id,
      department_id,
      section_id,
      user_fname,
      user_lname,
      user_login,
      password,
      user_level
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  pool.query(
    query,
    [
      user_id,
      department_id,
      section_id,
      user_fname,
      user_lname,
      user_login,
      password,
      user_level,
    ],
    (err, result) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.status(201).json({ message: "User registered successfully" });
      }
    }
  );
});
module.exports = router;
