//token.js
const jwt = require("jsonwebtoken");
const tokendata = require("./token_data.json");

class token {
  static getAccessToken(payload) {
    return jwt.sign(payload, tokendata["secret_key"], { expiresIn: "1m" });
  }

  static chekAuthentication(request) {
    try {
      let accessToken = request.headers.authorization.split(" ")[1];
      let jwtResponse = jwt.verify(
        String(accessToken),
        tokendata["secret_key"]
      );
      return true; // แทนการ return ค่าใดๆ เพิ่ม return true เมื่อ verify สำเร็จ
    } catch (error) {
      localStorage.removeItem("token"); // ลบ token ในกรณีที่ verify ล้มเหลว
      return false;
    }
  }

  static getSecret() {
    return require("crypto").randomBytes(64).toString("hex");
  }
}

module.exports = token;
