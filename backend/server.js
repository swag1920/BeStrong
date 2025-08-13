const app = require("./app")
const conectarDB = require("./config/conexion")
const config = require("./config/configuracion")

// Conectar a la base de datos
conectarDB()

// Iniciar servidor
app.listen(config.PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor backend corriendo en puerto ${config.PORT}`)
  console.log(`🔍 Documentación Swagger disponible en: http://localhost:${config.PORT}/api-docs`)
  console.log(`🌍 Entorno: ${config.NODE_ENV}`)
})
