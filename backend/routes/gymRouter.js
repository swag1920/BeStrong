const express = require("express")
const router = express.Router()
const {
  verificarToken,
  registrarUsuario,
  loginUsuario,
  obtenerUsuario,
  actualizarUsuario,
  agregarActividad,
  modificarActividad,
  eliminarActividad,
  obtenerHistorial,
  actualizarComidas,
} = require("../controllers/ejercicioController")

// Rutas públicas
router.post("/register", registrarUsuario)
router.post("/login", loginUsuario)

// Rutas protegidas - Usuario
router.get("/:id", verificarToken, obtenerUsuario)
router.put("/:id", verificarToken, actualizarUsuario)

// Rutas protegidas - Actividades
router.post("/:id/actividades", verificarToken, agregarActividad)
router.put("/:id/actividades/:activityId", verificarToken, modificarActividad)
router.delete("/:id/actividades/:activityId", verificarToken, eliminarActividad)

// Rutas protegidas - Historial
router.get("/:id/historial", verificarToken, obtenerHistorial)

// Rutas protegidas - Nutrición
router.put("/:id/comidas", verificarToken, actualizarComidas)

module.exports = router
