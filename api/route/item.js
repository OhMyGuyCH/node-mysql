const express = require("express");
const router = express.Router();
const pool = require("../../dbcon");
const mysql = require("mysql");
const mergeJSON = require("merge-json");

//เรียกหมด
router.get("/", (req, res) => {
  pool.query("SELECT * FROM item", (error, results) => {
    if (error) throw error;
    res.status(200).json(results);
  });
});

//เรียก id
router.get("/id", (req, res) => {
  pool.query("SELECT item_id FROM item", (error, results) => {
    if (error) throw error;
    res.status(200).json(results);
  });
});

//เรียก 1
router.get("/:itemID", (req, res) => {
  let id = req.params.itemID;

  pool.query(
    "SELECT * FROM item WHERE item_id = '" + id + "' ",
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
    "INSERT INTO `item` (`item_id`, `unit_id` , `group_id` , `item_name`,`item_onhand`,`item_price`) " +
    "VALUES (?, ?,?,?,?,?)";
  sql = mysql.format(sql, [
    data.item_id,
    data.unit_id,
    data.group_id,
    data.item_name,
    data.item_onhand,
    data.item_price,
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
    }
  });
});

// ลบข้อมูล
router.delete("/:itemID", (req, res) => {
  let id = req.params.itemID;
  let sql = "DELETE FROM item WHERE item_id = ?";
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

// //แก้ไข
// router.put("/:itemID", (req, res) => {
//   let id = req.params.itemID;
//   let data = req.body;

//   // Query old data
//   let oldSql = "SELECT * FROM item WHERE item_id=?";
//   oldSql = mysql.format(oldSql, [id]);
//   let jsonoldData = {};
//   pool.query(oldSql, (error, results, fields) => {
//     let oldData = results[0];
//     jsonoldData = JSON.parse(JSON.stringify(oldData));
//     // console.log(jsonoldData);

//     // Update object data
//     let newdata = mergeJSON.merge(jsonoldData, data);
//     // console.log(newdata);

//     // Save into database
//     let sql =
//       "UPDATE item set unit_id=? , group_id=? , item_name=?,item_onhand=?,item_price=? WHERE item_id=?";
//     sql = mysql.format(sql, [
//       newdata.unit_id,
//       newdata.group_id,
//       newdata.item_name,
//       newdata.item_onhand,
//       newdata.item_price,
//       newdata.item_id,
//     ]);

//     pool.query(sql, (error, results, fields) => {
//       if (error) throw error;
//       if (results.affectedRows == 1) {
//         //affectedRows คือ มีผลกระทบ1แถว
//         res.status(201).json({
//           message: "Update SUCCESS",
//         });
//       } else {
//         res.status(400).json({
//           message: "Update FAILED",
//         });
//       }
//     });
//   });
// });

//แก้ไขข้อมูลหลายแถว
router.put("/", (req, res) => {
  const itemid = req.body;

  if (!Array.isArray(itemid) || itemid.length === 0) {
    return res
      .status(400)
      .send({ message: "Invalid data format. Expected array of objects." });
  }
  const queries = itemid.map((line) => {
    const { item_id, unit_id, group_id, item_name, item_onhand, item_price } =
      line;

    if (!item_id) {
      return res.status(400).send({ message: "Missing required fields" });
    }

    const query = `
    UPDATE item
    SET unit_id = ?, group_id = ?, item_name = ?, item_onhand = ?, item_price = ?
    WHERE item_id = ?;
  `;

    const values = [
      unit_id,
      group_id,
      item_name,
      item_onhand,
      item_price,
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
            item_id,
          });
        }

        resolve({
          message: "Request line updated successfully",
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
