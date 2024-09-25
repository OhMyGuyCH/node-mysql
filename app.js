const express = require("express");

const app = express();
// const app = require("./server");
const indexRouter = require("./api/route/index");
const userRouter = require("./api/route/user");
const loginRouter = require("./api/route/login");
const registerRouter = require("./api/route/register");
const departmentRouter = require("./api/route/department");
const sectionRouter = require("./api/route/section");
const itemRouter = require("./api/route/item");
const unitRouter = require("./api/route/unit");
const planOrderRouter = require("./api/route/plan_order");
const planLineRouter = require("./api/route/plan_line");
const requestOrderRouter = require("./api/route/request_order");
const requestLineRouter = require("./api/route/request_line");
const receiveRouter = require("./api/route/receive");
const receiveLineRouter = require("./api/route/receive_line");

const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const token = require("./token");

const cors = require("cors");

const corsOptions = {
  origin: "http://192.168.9.175:4200",
  Credentials: true,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use("/index", indexRouter);
app.use("/user", userRouter);
app.use("/login", loginRouter);
app.use("/register", registerRouter);
app.use("/department", departmentRouter);
app.use("/section", sectionRouter);
app.use("/item", itemRouter);
app.use("/unit", unitRouter);
app.use("/planorder", planOrderRouter);
app.use("/planline", planLineRouter);
app.use("/requestorder", requestOrderRouter);
app.use("/requestline", requestLineRouter);
app.use("/receive", receiveRouter);
app.use("/receiveline", receiveLineRouter);

module.exports = app;
