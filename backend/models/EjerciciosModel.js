const mongoose = require("mongoose")

const activitySchema = new mongoose.Schema({
  fecha: { type: String, required: true }, // ISO yyyy-mm-dd
  nombre: { type: String, required: true },
  duracion: { type: Number, required: true },
  calorias: { type: Number, required: true },
})

const mealSchema = new mongoose.Schema(
  {
    nombre: String,
    calorias: Number,
  },
  { _id: false },
)

const mealDaySchema = new mongoose.Schema(
  {
    desayuno: mealSchema,
    comida: mealSchema,
    cena: mealSchema,
  },
  { _id: false },
)

const statsDaySchema = new mongoose.Schema(
  {
    caloriasConsumidas: { type: Number, default: 0 },
    minutosActividad: { type: Number, default: 0 },
    caloriasQuemadas: { type: Number, default: 0 },
  },
  { _id: false },
)

const dayDataSchema = new mongoose.Schema(
  {
    fecha: { type: String, required: true },
    comidas: mealDaySchema,
    estadisticas: statsDaySchema,
  },
  { _id: false },
)

const userSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    contraseña: { type: String, required: true },
    actividades: [activitySchema],
    comidas: mealDaySchema,
    estadisticas: statsDaySchema,
    datosPorDia: [dayDataSchema],
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("User", userSchema)
