// server.js
const express = require("express");
const path = require("path");
const http = require("http");
const port = process.env.port || 3000;
// const app = express();
const app = require("./app");

// เส้นทางไปยังโฟลเดอร์ dist ของ Angular
const angularAppPath = path.join(
  __dirname,
  "../AngularStationary/dist/angular-stationary/browser"
);

// ใช้ express.static เพื่อให้บริการไฟล์ static
app.use(express.static(angularAppPath));

// ส่งไฟล์ index.html สำหรับเส้นทางหลัก '/'
app.get("/", (req, res) => {
  res.sendFile(path.join(angularAppPath, "index.html"));
});

// ส่งไฟล์ index.html สำหรับทุกเส้นทางอื่น ๆ (สำหรับ Angular routing)
app.get("*", (req, res) => {
  res.sendFile(path.join(angularAppPath, "index.html"));
});

// เริ่มเซิร์ฟเวอร์
app.listen(port, () => {
  console.log(`Server started on port ${port} - http://localhost:${port}`);
});
