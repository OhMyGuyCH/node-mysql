//plan_line.js (node.js)
const express = require("express");
const router = express.Router();
const pool = require("../../dbcon");
const mysql = require("mysql");
const mergeJSON = require("merge-json");

//เรียกหมด
router.get("/", (req, res) => {
  pool.query("SELECT * FROM request_order_line", (error, results) => {
    if (error) throw error;
    res.status(200).json(results);
  });
});

//เรียกหมด จาก request_id1
router.get("/:request_id", (req, res) => {
  const planId = req.params.request_id;
  const sql = "SELECT * FROM request_order_line WHERE request_id = ?";
  pool.query(sql, [planId], (error, results) => {
    if (error) throw error;
    res.status(200).json(results);
  });
});

// เรียกข้อมูล item_id จาก request_id
router.get("/itemsByPlanId/:plan_id", (req, res) => {
  const planId = req.params.plan_id;
  const sql = "SELECT item_id FROM request_order_line WHERE request_id = ?";
  pool.query(sql, [planId], (error, results) => {
    if (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ message: "Internal Server Error" });
    } else {
      res.status(200).json(results);
    }
  });
});

//เรียก id
router.get("/id", (req, res) => {
  pool.query(
    "SELECT request_line FROM request_order_line",
    (error, results) => {
      if (error) throw error;
      res.status(200).json(results);
    }
  );
});

//เรียก 1
router.get("/:plan_line/:plan_id", (req, res) => {
  const requestLine = req.params.plan_line;
  const requestId = req.params.plan_id;

  pool.query(
    "SELECT * FROM request_order WHERE request_line = '" +
      requestLine +
      "'AND request_id ='" +
      requestId +
      "'",
    (error, results, fields) => {
      if (error) throw error;
      res.status(200).json(results);
    }
  );
});

//เพิ่ม
router.post("/", (req, res) => {
  let data = req.body;
  // ตรวจสอบว่า data เป็น array หรือไม่
  if (!Array.isArray(data)) {
    res.status(400).json({
      message: "Invalid data format. Expected array of objects.",
    });
    return;
  }
  // หา plan_line ที่ไม่ซ้ำ
  const findNextRequestLine = () => {
    return new Promise((resolve, reject) => {
      pool.query(
        "SELECT MAX(request_line) AS maxRequestLine FROM request_order_line",
        (error, results) => {
          if (error) return reject(error);
          const nextRequestLine = (results[0].maxRequestLine || 0) + 1;
          resolve(nextRequestLine);
        }
      );
    });
  };
  findNextRequestLine()
    .then((nextRequestLine) => {
      let sqlValues = [];
      for (let item of data) {
        sqlValues.push([
          item.request_line || nextRequestLine++,
          item.request_id,
          item.item_id,
          item.request_quantity,
          item.unit_id,
          item.issue_quantity,
          item.issue_date,
        ]);
      }
      pool.query(
        "INSERT INTO `request_order_line` (`request_line`, `request_id`, `item_id`, `request_quantity`, `unit_id`,`issue_quantity`,`issue_date`) VALUES ?",
        [sqlValues],
        (error, results, fields) => {
          if (error) {
            res.status(400).json({
              message: "Insert FAILED" + error,
            });
          } else if (results.affectedRows > 0) {
            res.status(201).json({
              message: `Insert SUCCESS: ${results.affectedRows} rows affected`,
            });
          } else {
            res.status(400).json({
              message: "Insert FAILED: No rows affected",
            });
            console.log(results);
          }
        }
      );
    })
    .catch((error) => {
      res.status(500).json({
        message: "Error finding next Request_line: " + error,
      });
    });
});

// Delete non-target items
router.delete("/:request_id", async (req, res) => {
  try {
    const planId = req.params.plan_id;
    const targetItems = req.body.items; // Adjusted to match the expected structure
    const targetItemIds = targetItems.map((item) => item.item_id); // Extract item IDs from request body

    console.log("Received plan ID:", planId); // Log plan ID
    console.log("Received target items:", JSON.stringify(targetItems)); // Log target items
    console.log("Target item IDs:", targetItemIds); // Log target item IDs

    if (!targetItemIds || targetItemIds.length === 0) {
      console.error("No target items received");
      res.status(400).json({ message: "No target items received" });
      return;
    }

    const sql = `DELETE FROM request_order_line WHERE request_id = ? AND item_id IN (?)`;
    const sqlFormatted = mysql.format(sql, [planId, targetItemIds]);

    console.log("SQL Query:", sqlFormatted); // Log SQL query

    pool.query(sqlFormatted, (error, results, fields) => {
      if (error) {
        console.error("Error deleting non-target items:", error);
        res.status(500).json({ message: "Internal Server Error" });
        return;
      }

      res.status(200).json({
        message: `Non-target items deleted successfully for plan ID ${planId}`,
        affectedRows: results.affectedRows,
      });
    });
  } catch (error) {
    console.error("Error handling delete request:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//แก้ไขข้อมูลหลายแถว
router.put("/", (req, res) => {
  const requestLines = req.body;

  if (!Array.isArray(requestLines) || requestLines.length === 0) {
    return res
      .status(400)
      .send({ message: "Invalid data format. Expected array of objects." });
  }
  const queries = requestLines.map((line) => {
    const {
      request_line,
      request_id,
      item_id,
      request_quantity,
      unit_id,
      issue_quantity,
      issue_date,
    } = line;

    if (!request_line || !request_id || !item_id) {
      return res.status(400).send({ message: "Missing required fields" });
    }

    const query = `
    UPDATE request_order_line
    SET request_quantity = ?, unit_id = ?, issue_quantity = ?, issue_date = CURRENT_TIMESTAMP()
    WHERE request_line = ? AND request_id = ? AND item_id = ?;
  `;

    const values = [
      request_quantity,
      unit_id,
      issue_quantity,

      request_line,
      request_id,
      item_id,
    ];
    return new Promise((resolve, reject) => {
      pool.query(query, values, (error, results) => {
        if (error) {
          return reject({ message: "Database error", error });
        }

        if (results.affectedRows === 0) {
          return reject({
            message: "Request line not found",
            request_line,
            request_id,
            item_id,
          });
        }

        resolve({
          message: "Request line updated successfully",
          request_line,
          request_id,
          item_id,
        });
      });
    });
  });
  Promise.all(queries)
    .then((results) => {
      res.send({ message: "All request lines updated successfully", results });
    })
    .catch((error) => {
      console.error("Error updating request lines:", error);
      res
        .status(500)
        .send({ message: "Failed to update one or more request lines", error });
    });
});

module.exports = router;
