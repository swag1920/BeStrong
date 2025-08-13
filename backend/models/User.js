const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    fecha: String,   // ISO yyyy-mm-dd
    nombre: String,
    duracion: Number,
    calorias: Number
});

const mealSchema = new mongoose.Schema({
    nombre: String,
    calorias: Number
}, { _id: false });

const mealDaySchema = new mongoose.Schema({
    desayuno: mealSchema,
    comida: mealSchema,
    cena: mealSchema
}, { _id: false });

const statsDaySchema = new mongoose.Schema({
    caloriasConsumidas: { type: Number, default: 0 },
    minutosActividad: { type: Number, default: 0 },
    caloriasQuemadas: { type: Number, default: 0 }
}, { _id: false });

const dayDataSchema = new mongoose.Schema({
    fecha: { type: String, required: true },
    comidas: mealDaySchema,
    estadisticas: statsDaySchema
}, { _id: false });

const userSchema = new mongoose.Schema({
    nombre: String,
    email: { type: String, unique: true, required: true },
    contraseña: { type: String, required: true },
    actividades: [activitySchema],
    comidas: mealDaySchema,
    estadisticas: statsDaySchema,
    datosPorDia: [dayDataSchema]
});

module.exports = mongoose.model('User', userSchema);
