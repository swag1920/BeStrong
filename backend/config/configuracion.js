require("dotenv").config()

const config = {
  PORT: process.env.PORT || 3000,
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/bestrong",
  JWT_SECRET: process.env.JWT_SECRET || "mi_clave_super_secreta",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1h",
  NODE_ENV: process.env.NODE_ENV || "development",
}

module.exports = config
