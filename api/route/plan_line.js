//plan_line.js (node.js)
const express = require("express");
const router = express.Router();
const pool = require("../../dbcon");
const mysql = require("mysql");
const mergeJSON = require("merge-json");

//เรียกหมด
router.get("/", (req, res) => {
  pool.query("SELECT * FROM plan_order_line", (error, results) => {
    if (error) throw error;
    res.status(200).json(results);
  });
});

//เรียกหมด จาก plan_id1
router.get("/:plan_id", (req, res) => {
  const planId = req.params.plan_id;
  const sql = "SELECT * FROM plan_order_line WHERE plan_id = ?";
  pool.query(sql, [planId], (error, results) => {
    if (error) throw error;
    res.status(200).json(results);
  });
});

// เรียกข้อมูล item_id จาก plan_id
router.get("/itemsByPlanId/:plan_id", (req, res) => {
  const planId = req.params.plan_id;
  const sql = "SELECT item_id FROM plan_order_line WHERE plan_id = ?";
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
  pool.query("SELECT plan_line FROM plan_order_line", (error, results) => {
    if (error) throw error;
    res.status(200).json(results);
  });
});

//เรียก 1
router.get("/:plan_line/:plan_id", (req, res) => {
  const planLine = req.params.plan_line;
  const planId = req.params.plan_id;

  pool.query(
    "SELECT * FROM plan_order WHERE plan_line = '" +
      planLine +
      "'AND plan_id ='" +
      planId +
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
  const findNextPlanLine = () => {
    return new Promise((resolve, reject) => {
      pool.query(
        "SELECT MAX(plan_line) AS maxPlanLine FROM plan_order_line",
        (error, results) => {
          if (error) return reject(error);
          const nextPlanLine = (results[0].maxPlanLine || 0) + 1;
          resolve(nextPlanLine);
        }
      );
    });
  };
  findNextPlanLine()
    .then((nextPlanLine) => {
      let sqlValues = [];
      for (let item of data) {
        sqlValues.push([
          item.plan_line,
          item.plan_id,
          item.item_id,
          item.plan_quantity,
          item.unit_id,
          item.balance_quantity,
        ]);
      }
      pool.query(
        "INSERT INTO `plan_order_line` (`plan_line`, `plan_id`, `item_id`, `plan_quantity`, `unit_id` , `balance_quantity`) VALUES ?",
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
        message: "Error finding next plan_line: " + error,
      });
    });
});

// ลบข้อมูล
// router.delete("/:itemID", (req, res) => {
//   let id = req.params.itemID;
//   let sql = "DELETE FROM plan_order_line WHERE plan_line = ? AND plan_id = ?";
//   sql = mysql.format(sql, [id]);

//   pool.query(sql, (error, results, fields) => {
//     if (error) throw error;
//     if (results.affectedRows == 1) {
//       //affectedRows คือ มีผลกระทบ1แถว
//       res.status(201).json({
//         message: "Delete SUCCESS",
//       });
//     } else {
//       res.status(400).json({
//         message: "Delete FAILED",
//       });
//     }
//   });
// });

// Delete non-target items
router.delete("/:plan_id", async (req, res) => {
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

    const sql = `DELETE FROM plan_order_line WHERE plan_id = ? AND item_id IN (?)`;
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
  let data = req.body;

  // ตรวจสอบว่า data เป็น array หรือไม่
  if (!Array.isArray(data)) {
    res.status(400).json({
      message: "Invalid data format. Expected array of objects.",
    });
    return;
  }

  // ฟังก์ชันเพื่ออัปเดตหรือเพิ่มแต่ละแถว
  const updateOrInsertRow = (item, nextPlanLine, callback) => {
    const {
      plan_line,
      plan_id,
      item_id,
      plan_quantity,
      unit_id,
      balance_quantity,
    } = item;

    // ตรวจสอบว่ามีแถวที่ระบุอยู่ในฐานข้อมูลหรือไม่
    const checkSql =
      "SELECT * FROM plan_order_line WHERE plan_line = ? AND plan_id = ?";
    const checkSqlFormatted = mysql.format(checkSql, [plan_line, plan_id]);

    pool.query(checkSqlFormatted, (error, results) => {
      if (error) return callback(error);

      if (results.length > 0) {
        // แถวที่ระบุมีอยู่ในฐานข้อมูล อัปเดตข้อมูล
        let oldData = results[0];
        let jsonoldData = JSON.parse(JSON.stringify(oldData));
        let mergedData = mergeJSON.merge(jsonoldData, item);

        const updateSql =
          "UPDATE plan_order_line SET item_id=?, plan_quantity=?, unit_id=? , balance_quantity=? WHERE plan_line = ? AND plan_id = ?";
        const updateSqlFormatted = mysql.format(updateSql, [
          mergedData.item_id,
          mergedData.plan_quantity,
          mergedData.unit_id,
          mergedData.balance_quantity,
          mergedData.plan_line,
          mergedData.plan_id,
        ]);

        pool.query(updateSqlFormatted, (error, results) => {
          if (error) return callback(error);
          if (results.affectedRows !== 1) {
            return callback(
              new Error(
                `Update failed for plan_line ${plan_line} and plan_id ${plan_id}`
              )
            );
          }
          callback(null, results);
        });
      } else {
        // แถวที่ระบุไม่มีอยู่ในฐานข้อมูล เพิ่มข้อมูลใหม่
        const insertSql =
          "INSERT INTO plan_order_line (plan_line, plan_id, item_id, plan_quantity, unit_id , balance_quantity) VALUES (?, ?, ?, ?, ?, ?)";
        const insertSqlFormatted = mysql.format(insertSql, [
          nextPlanLine,
          plan_id,
          item_id,
          plan_quantity,
          unit_id,
          balance_quantity,
        ]);

        pool.query(insertSqlFormatted, (error, results) => {
          if (error) return callback(error);
          if (results.affectedRows !== 1) {
            return callback(
              new Error(`Insert failed for new plan_line ${nextPlanLine}`)
            );
          }
          callback(null, results);
        });
      }
    });
  };

  // หา plan_line ที่ไม่ซ้ำ
  const findNextPlanLine = () => {
    return new Promise((resolve, reject) => {
      pool.query(
        "SELECT MAX(plan_line) AS maxPlanLine FROM plan_order_line",
        (error, results) => {
          if (error) return reject(error);
          const nextPlanLine = (results[0].maxPlanLine || 0) + 1;
          resolve(nextPlanLine);
        }
      );
    });
  };

  findNextPlanLine()
    .then((nextPlanLine) => {
      let updatePromises = data.map(
        (item) =>
          new Promise((resolve, reject) => {
            updateOrInsertRow(item, nextPlanLine++, (error, results) => {
              if (error) return reject(error);
              resolve(results);
            });
          })
      );

      Promise.all(updatePromises)
        .then((results) => {
          res.status(200).json({
            message: "Update/Insert SUCCESS",
            results,
          });
        })
        .catch((error) => {
          console.error("Error updating or inserting records:", error);
          res.status(500).json({
            message: "Update/Insert FAILED",
            error: error.message,
          });
        });
    })
    .catch((error) => {
      res.status(500).json({
        message: "Error finding next plan_line: " + error,
      });
    });
});

module.exports = router;
