//plan_line.js (node.js)
const express = require("express");
const router = express.Router();
const pool = require("../../dbcon");
const mysql = require("mysql");
const mergeJSON = require("merge-json");

//เรียกหมด
router.get("/", (req, res) => {
  pool.query("SELECT * FROM receive_order_line", (error, results) => {
    if (error) throw error;
    res.status(200).json(results);
  });
});

//เรียกหมด จาก receive_id1
router.get("/:receive_id", (req, res) => {
  const receiveId = req.params.receive_id;
  const sql = "SELECT * FROM receive_order_line WHERE receive_id = ?";
  pool.query(sql, [receiveId], (error, results) => {
    if (error) throw error;
    res.status(200).json(results);
  });
});

// เรียกข้อมูล item_id จาก plan_id
router.get("/itemsByReceiveId/:receive_id", (req, res) => {
  const receiveId = req.params.receive_id;
  const sql = "SELECT item_id FROM receive_order_line WHERE receive_id = ?";
  pool.query(sql, [receiveId], (error, results) => {
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
    "SELECT receive_line FROM receive_order_line",
    (error, results) => {
      if (error) throw error;
      res.status(200).json(results);
    }
  );
});

//เรียก 1
router.get("/:receive_line/:receive_id", (req, res) => {
  const planLine = req.params.receive_line;
  const planId = req.params.receive_id;

  pool.query(
    "SELECT * FROM receive_order WHERE receive_line = '" +
      planLine +
      "'AND receive_id ='" +
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
        "SELECT MAX(receive_line) AS maxReceiveLine FROM receive_order_line",
        (error, results) => {
          if (error) return reject(error);
          const nextReceiveLine = (results[0].maxReceiveLine || 0) + 1;
          resolve(nextReceiveLine);
        }
      );
    });
  };
  findNextPlanLine()
    .then((nextReceiveLine) => {
      let sqlValues = [];
      for (let item of data) {
        sqlValues.push([
          item.receive_line,
          item.receive_id,
          item.item_id,
          item.receive_quantity,
          item.unit_id,
          item.receive_price,
        ]);
      }
      pool.query(
        "INSERT INTO `receive_order_line` (`receive_line`, `receive_id`, `item_id`, `receive_quantity`, `unit_id` , `receive_price`) VALUES ?",
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
        message: "Error finding next receive_line: " + error,
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
router.delete("/:receive_id", async (req, res) => {
  try {
    const receiveId = req.params.receive_id;
    const targetItems = req.body.items; // Adjusted to match the expected structure
    const targetItemIds = targetItems.map((item) => item.item_id); // Extract item IDs from request body

    console.log("Received receive ID:", receiveId); // Log plan ID
    console.log("Received target items:", JSON.stringify(targetItems)); // Log target items
    console.log("Target item IDs:", targetItemIds); // Log target item IDs

    if (!targetItemIds || targetItemIds.length === 0) {
      console.error("No target items received");
      res.status(400).json({ message: "No target items received" });
      return;
    }

    const sql = `DELETE FROM receive_order_line WHERE receive_id = ? AND item_id IN (?)`;
    const sqlFormatted = mysql.format(sql, [receiveId, targetItemIds]);

    console.log("SQL Query:", sqlFormatted); // Log SQL query

    pool.query(sqlFormatted, (error, results, fields) => {
      if (error) {
        console.error("Error deleting non-target items:", error);
        res.status(500).json({ message: "Internal Server Error" });
        return;
      }

      res.status(200).json({
        message: `Non-target items deleted successfully for receive ID ${receiveId}`,
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
  const updateOrInsertRow = (item, nextReceiveLine, callback) => {
    const {
      receive_line,
      receive_id,
      item_id,
      receive_quantity,
      unit_id,
      receive_price,
    } = item;

    // ตรวจสอบว่ามีแถวที่ระบุอยู่ในฐานข้อมูลหรือไม่
    const checkSql =
      "SELECT * FROM receive_order_line WHERE receive_line = ? AND receive_id = ?";
    const checkSqlFormatted = mysql.format(checkSql, [
      receive_line,
      receive_id,
    ]);

    pool.query(checkSqlFormatted, (error, results) => {
      if (error) return callback(error);

      if (results.length > 0) {
        // แถวที่ระบุมีอยู่ในฐานข้อมูล อัปเดตข้อมูล
        let oldData = results[0];
        let jsonoldData = JSON.parse(JSON.stringify(oldData));
        let mergedData = mergeJSON.merge(jsonoldData, item);

        const updateSql =
          "UPDATE receive_order_line SET item_id=?, receive_quantity=?, unit_id=? , receive_price=? WHERE receive_line = ? AND receive_id = ?";
        const updateSqlFormatted = mysql.format(updateSql, [
          mergedData.item_id,
          mergedData.receive_quantity,
          mergedData.unit_id,
          mergedData.receive_price,
          mergedData.receive_line,
          mergedData.receive_id,
        ]);

        pool.query(updateSqlFormatted, (error, results) => {
          if (error) return callback(error);
          if (results.affectedRows !== 1) {
            return callback(
              new Error(
                `Update failed for plan_line ${receive_line} and plan_id ${receive_id}`
              )
            );
          }
          callback(null, results);
        });
      } else {
        // แถวที่ระบุไม่มีอยู่ในฐานข้อมูล เพิ่มข้อมูลใหม่
        const insertSql =
          "INSERT INTO receive_order_line (receive_line, receive_id, item_id, receive_quantity, unit_id , receive_price) VALUES (?, ?, ?, ?, ?, ?)";
        const insertSqlFormatted = mysql.format(insertSql, [
          nextReceiveLine,
          receive_id,
          item_id,
          receive_quantity,
          unit_id,
          receive_price,
        ]);

        pool.query(insertSqlFormatted, (error, results) => {
          if (error) return callback(error);
          if (results.affectedRows !== 1) {
            return callback(
              new Error(`Insert failed for new plan_line ${nextReceiveLine}`)
            );
          }
          callback(null, results);
        });
      }
    });
  };

  // หา plan_line ที่ไม่ซ้ำ
  const findNextReceiveLine = () => {
    return new Promise((resolve, reject) => {
      pool.query(
        "SELECT MAX(receive_line) AS maxReceiveLine FROM receive_order_line",
        (error, results) => {
          if (error) return reject(error);
          const nextReceiveLine = (results[0].maxReceiveLine || 0) + 1;
          resolve(nextReceiveLine);
        }
      );
    });
  };

  findNextReceiveLine()
    .then((nextReceiveLine) => {
      let updatePromises = data.map(
        (item) =>
          new Promise((resolve, reject) => {
            updateOrInsertRow(item, nextReceiveLine++, (error, results) => {
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
        message: "Error finding next receive_line: " + error,
      });
    });
});

module.exports = router;
