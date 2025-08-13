const express = require("express")
const cors = require("cors")
const swaggerUi = require("swagger-ui-express")
const swaggerFile = require("./swagger_output.json")
const gymRouter = require("./routes/gymRouter")

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Rutas API
app.use("/api/users", gymRouter)

// Documentación Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile))

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({
    message: "API BeStrong funcionando correctamente",
    documentation: "/api-docs",
  })
})

module.exports = app
