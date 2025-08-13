const swaggerAutogen = require("swagger-autogen")()

const doc = {
  info: {
    title: "API BeStrong",
    description:
      "API completa para el sistema de gimnasio digital BeStrong. Incluye gestión de usuarios, actividades, nutrición e historial.",
    version: "2.0.0",
  },
  host: "localhost:3000",
  schemes: ["http"],
  consumes: ["application/json"],
  produces: ["application/json"],
  securityDefinitions: {
    bearerAuth: {
      type: "apiKey",
      in: "header",
      name: "Authorization",
      description: "Token JWT en formato: Bearer {token}",
    },
  },
  tags: [
    { name: "Usuarios", description: "Operaciones de autenticación y gestión de usuarios" },
    { name: "Actividades", description: "Gestión de actividades físicas" },
    { name: "Historial", description: "Consulta de historial por fechas" },
    { name: "Nutrición", description: "Gestión de comidas y nutrición" },
  ],
  definitions: {
    UserRegister: {
      nombre: "Juan Pérez",
      email: "juan@example.com",
      password: "123456",
    },
    UserLogin: {
      email: "juan@example.com",
      password: "123456",
    },
    UserResponse: {
      _id: "507f1f77bcf86cd799439011",
      nombre: "Juan Pérez",
      email: "juan@example.com",
      actividades: [{ $ref: "#/definitions/Activity" }],
      comidas: { $ref: "#/definitions/MealDay" },
      estadisticas: { $ref: "#/definitions/Stats" },
      datosPorDia: [{ $ref: "#/definitions/DayData" }],
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
    UserUpdate: {
      actividades: [{ $ref: "#/definitions/Activity" }],
      comidas: { $ref: "#/definitions/MealDay" },
      estadisticas: { $ref: "#/definitions/Stats" },
      datosPorDia: [{ $ref: "#/definitions/DayData" }],
    },
    Activity: {
      fecha: "2024-01-15",
      nombre: "Correr",
      duracion: 30,
      calorias: 300,
    },
    MealDay: {
      desayuno: { $ref: "#/definitions/Meal" },
      comida: { $ref: "#/definitions/Meal" },
      cena: { $ref: "#/definitions/Meal" },
    },
    Meal: {
      nombre: "Avena con frutas",
      calorias: 250,
    },
    Stats: {
      caloriasConsumidas: 800,
      minutosActividad: 60,
      caloriasQuemadas: 400,
    },
    DayData: {
      fecha: "2024-01-15",
      comidas: { $ref: "#/definitions/MealDay" },
      estadisticas: { $ref: "#/definitions/Stats" },
    },
    MealUpdate: {
      fecha: "2024-01-15",
      tipoComida: "desayuno",
      comida: { $ref: "#/definitions/Meal" },
    },
    HistorialResponse: {
      fecha: "2024-01-15",
      actividades: [{ $ref: "#/definitions/Activity" }],
      comidas: { $ref: "#/definitions/MealDay" },
      estadisticas: { $ref: "#/definitions/Stats" },
    },
  },
}

const outputFile = "./swagger_output.json"
const endpointsFiles = ["./routes/gymRouter.js"]

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  console.log("📝 Documentación Swagger generada exitosamente")
})
