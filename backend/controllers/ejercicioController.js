const User = require("../models/EjerciciosModel")
const jwt = require("jsonwebtoken")
const config = require("../config/configuracion")

/**
 * Middleware para verificar JWT y proteger rutas
 */
const verificarToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  if (!authHeader) return res.status(403).json({ message: "Token requerido" })

  const token = authHeader.split(" ")[1] // Bearer <token>
  if (!token) return res.status(403).json({ message: "Token requerido" })

  jwt.verify(token, config.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Token inválido o expirado" })
    req.user = decoded
    next()
  })
}

/**
 * Función auxiliar para obtener o crear datosPorDia para una fecha
 */
const getDatosDelDia = (usuario, fecha) => {
  if (!Array.isArray(usuario.datosPorDia)) usuario.datosPorDia = []

  let datos = usuario.datosPorDia.find((d) => d.fecha === fecha)
  if (!datos) {
    datos = {
      fecha,
      comidas: { desayuno: null, comida: null, cena: null },
      estadisticas: { caloriasConsumidas: 0, minutosActividad: 0, caloriasQuemadas: 0 },
    }
    usuario.datosPorDia.push(datos)
  }
  return datos
}

// Registro de usuario
const registrarUsuario = async (req, res) => {
  /*  #swagger.tags = ['Usuarios']
        #swagger.description = 'Registrar un nuevo usuario'
        #swagger.parameters['body'] = {
            in: 'body',
            description: 'Datos del usuario',
            required: true,
            schema: { $ref: '#/definitions/UserRegister' }
        }
        #swagger.responses[201] = {
            description: 'Usuario registrado exitosamente',
            schema: {
                msg: 'Usuario registrado exitosamente',
                user: { $ref: '#/definitions/UserResponse' }
            }
        }
        #swagger.responses[400] = { description: 'Datos inválidos o email ya registrado' }
    */
  try {
    const { nombre, email, password } = req.body
    if (!nombre || !email || !password) {
      return res.status(400).json({ msg: "Todos los campos son obligatorios" })
    }

    const exists = await User.findOne({ email })
    if (exists) return res.status(400).json({ msg: "El email ya está registrado" })

    const newUser = new User({
      nombre,
      email,
      contraseña: password,
      actividades: [],
      comidas: { desayuno: null, comida: null, cena: null },
      estadisticas: { caloriasConsumidas: 0, minutosActividad: 0, caloriasQuemadas: 0 },
      datosPorDia: [],
    })

    await newUser.save()

    const userResponse = newUser.toObject()
    delete userResponse.contraseña

    res.status(201).json({
      msg: "Usuario registrado exitosamente",
      user: userResponse,
    })
  } catch (err) {
    console.error("Error en registro:", err)
    res.status(500).json({ error: err.message })
  }
}

// Login de usuario
const loginUsuario = async (req, res) => {
  /*  #swagger.tags = ['Usuarios']
        #swagger.description = 'Iniciar sesión de usuario'
        #swagger.parameters['body'] = {
            in: 'body',
            description: 'Credenciales de usuario',
            required: true,
            schema: { $ref: '#/definitions/UserLogin' }
        }
        #swagger.responses[200] = {
            description: 'Login exitoso',
            schema: {
                token: 'jwt_token_string',
                user: { $ref: '#/definitions/UserResponse' }
            }
        }
        #swagger.responses[401] = { description: 'Credenciales inválidas' }
    */
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ msg: "Email y contraseña son requeridos" })
    }

    const usuario = await User.findOne({ email, contraseña: password })
    if (!usuario) return res.status(401).json({ msg: "Credenciales inválidas" })

    // Generar token JWT
    const token = jwt.sign({ userId: usuario._id, email: usuario.email, nombre: usuario.nombre }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN,
    })

    const userResponse = usuario.toObject()
    delete userResponse.contraseña

    res.json({ token, user: userResponse })
  } catch (err) {
    console.error("Error en login:", err)
    res.status(500).json({ error: err.message })
  }
}

// Obtener usuario por ID
const obtenerUsuario = async (req, res) => {
  /*  #swagger.tags = ['Usuarios']
        #swagger.description = 'Obtener información de usuario por ID'
        #swagger.security = [{ "bearerAuth": [] }]
        #swagger.parameters['id'] = {
            in: 'path',
            description: 'ID del usuario',
            required: true,
            type: 'string'
        }
        #swagger.responses[200] = {
            description: 'Usuario encontrado',
            schema: { $ref: '#/definitions/UserResponse' }
        }
        #swagger.responses[403] = { description: 'Acceso no autorizado' }
        #swagger.responses[404] = { description: 'Usuario no encontrado' }
    */
  try {
    const requestedId = req.params.id
    const tokenUserId = req.user.userId

    if (tokenUserId !== requestedId) return res.status(403).json({ msg: "Acceso no autorizado" })

    const usuario = await User.findById(requestedId)
    if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" })

    const userResponse = usuario.toObject()
    delete userResponse.contraseña

    res.json(userResponse)
  } catch (err) {
    console.error("Error obteniendo usuario:", err)
    res.status(500).json({ error: err.message })
  }
}

// Actualizar usuario
const actualizarUsuario = async (req, res) => {
  /*  #swagger.tags = ['Usuarios']
        #swagger.description = 'Actualizar información de usuario'
        #swagger.security = [{ "bearerAuth": [] }]
        #swagger.parameters['id'] = {
            in: 'path',
            description: 'ID del usuario',
            required: true,
            type: 'string'
        }
        #swagger.parameters['body'] = {
            in: 'body',
            description: 'Datos a actualizar',
            required: true,
            schema: { $ref: '#/definitions/UserUpdate' }
        }
        #swagger.responses[200] = {
            description: 'Usuario actualizado',
            schema: { $ref: '#/definitions/UserResponse' }
        }
        #swagger.responses[403] = { description: 'Acceso no autorizado' }
        #swagger.responses[404] = { description: 'Usuario no encontrado' }
    */
  try {
    const requestedId = req.params.id
    const tokenUserId = req.user.userId

    if (tokenUserId !== requestedId) return res.status(403).json({ msg: "Acceso no autorizado" })

    const usuario = await User.findById(requestedId)
    if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" })

    const { actividades, comidas, estadisticas, datosPorDia } = req.body

    if (actividades) usuario.actividades = actividades
    if (comidas) usuario.comidas = comidas
    if (estadisticas) usuario.estadisticas = estadisticas
    if (datosPorDia) usuario.datosPorDia = datosPorDia

    await usuario.save()

    const userResponse = usuario.toObject()
    delete userResponse.contraseña

    res.json(userResponse)
  } catch (err) {
    console.error("Error actualizando usuario:", err)
    res.status(500).json({ error: err.message })
  }
}

// Agregar actividad
const agregarActividad = async (req, res) => {
  /*  #swagger.tags = ['Actividades']
        #swagger.description = 'Agregar una nueva actividad al usuario'
        #swagger.security = [{ "bearerAuth": [] }]
        #swagger.parameters['id'] = {
            in: 'path',
            description: 'ID del usuario',
            required: true,
            type: 'string'
        }
        #swagger.parameters['body'] = {
            in: 'body',
            description: 'Datos de la actividad',
            required: true,
            schema: { $ref: '#/definitions/Activity' }
        }
        #swagger.responses[201] = {
            description: 'Actividad agregada exitosamente',
            schema: { $ref: '#/definitions/UserResponse' }
        }
        #swagger.responses[403] = { description: 'Acceso no autorizado' }
        #swagger.responses[404] = { description: 'Usuario no encontrado' }
    */
  try {
    const requestedId = req.params.id
    const tokenUserId = req.user.userId

    if (tokenUserId !== requestedId) return res.status(403).json({ msg: "Acceso no autorizado" })

    const usuario = await User.findById(requestedId)
    if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" })

    const { fecha, nombre, duracion, calorias } = req.body

    if (!fecha || !nombre || !duracion || !calorias) {
      return res.status(400).json({ msg: "Todos los campos de la actividad son obligatorios" })
    }

    // Agregar actividad
    usuario.actividades.push({ fecha, nombre, duracion, calorias })

    // Actualizar estadísticas del día
    const datosDelDia = getDatosDelDia(usuario, fecha)
    datosDelDia.estadisticas.minutosActividad += duracion
    datosDelDia.estadisticas.caloriasQuemadas += calorias

    await usuario.save()

    const userResponse = usuario.toObject()
    delete userResponse.contraseña

    res.status(201).json({
      msg: "Actividad agregada exitosamente",
      user: userResponse,
    })
  } catch (err) {
    console.error("Error agregando actividad:", err)
    res.status(500).json({ error: err.message })
  }
}

// Modificar actividad
const modificarActividad = async (req, res) => {
  /*  #swagger.tags = ['Actividades']
        #swagger.description = 'Modificar una actividad existente'
        #swagger.security = [{ "bearerAuth": [] }]
        #swagger.parameters['id'] = {
            in: 'path',
            description: 'ID del usuario',
            required: true,
            type: 'string'
        }
        #swagger.parameters['activityId'] = {
            in: 'path',
            description: 'ID de la actividad',
            required: true,
            type: 'string'
        }
        #swagger.parameters['body'] = {
            in: 'body',
            description: 'Nuevos datos de la actividad',
            required: true,
            schema: { $ref: '#/definitions/Activity' }
        }
        #swagger.responses[200] = {
            description: 'Actividad modificada exitosamente',
            schema: { $ref: '#/definitions/UserResponse' }
        }
        #swagger.responses[403] = { description: 'Acceso no autorizado' }
        #swagger.responses[404] = { description: 'Usuario o actividad no encontrada' }
    */
  try {
    const requestedId = req.params.id
    const activityId = req.params.activityId
    const tokenUserId = req.user.userId

    if (tokenUserId !== requestedId) return res.status(403).json({ msg: "Acceso no autorizado" })

    const usuario = await User.findById(requestedId)
    if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" })

    const actividad = usuario.actividades.id(activityId)
    if (!actividad) return res.status(404).json({ msg: "Actividad no encontrada" })

    const { fecha, nombre, duracion, calorias } = req.body

    // Actualizar estadísticas del día (restar valores anteriores)
    const datosDelDiaAnterior = getDatosDelDia(usuario, actividad.fecha)
    datosDelDiaAnterior.estadisticas.minutosActividad -= actividad.duracion
    datosDelDiaAnterior.estadisticas.caloriasQuemadas -= actividad.calorias

    // Actualizar actividad
    if (fecha) actividad.fecha = fecha
    if (nombre) actividad.nombre = nombre
    if (duracion) actividad.duracion = duracion
    if (calorias) actividad.calorias = calorias

    // Actualizar estadísticas del día (sumar nuevos valores)
    const datosDelDiaNuevo = getDatosDelDia(usuario, actividad.fecha)
    datosDelDiaNuevo.estadisticas.minutosActividad += actividad.duracion
    datosDelDiaNuevo.estadisticas.caloriasQuemadas += actividad.calorias

    await usuario.save()

    const userResponse = usuario.toObject()
    delete userResponse.contraseña

    res.json({
      msg: "Actividad modificada exitosamente",
      user: userResponse,
    })
  } catch (err) {
    console.error("Error modificando actividad:", err)
    res.status(500).json({ error: err.message })
  }
}

// Eliminar actividad
const eliminarActividad = async (req, res) => {
  /*  #swagger.tags = ['Actividades']
        #swagger.description = 'Eliminar una actividad'
        #swagger.security = [{ "bearerAuth": [] }]
        #swagger.parameters['id'] = {
            in: 'path',
            description: 'ID del usuario',
            required: true,
            type: 'string'
        }
        #swagger.parameters['activityId'] = {
            in: 'path',
            description: 'ID de la actividad',
            required: true,
            type: 'string'
        }
        #swagger.responses[200] = {
            description: 'Actividad eliminada exitosamente',
            schema: { $ref: '#/definitions/UserResponse' }
        }
        #swagger.responses[403] = { description: 'Acceso no autorizado' }
        #swagger.responses[404] = { description: 'Usuario o actividad no encontrada' }
    */
  try {
    const requestedId = req.params.id
    const activityId = req.params.activityId
    const tokenUserId = req.user.userId

    if (tokenUserId !== requestedId) return res.status(403).json({ msg: "Acceso no autorizado" })

    const usuario = await User.findById(requestedId)
    if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" })

    const actividad = usuario.actividades.id(activityId)
    if (!actividad) return res.status(404).json({ msg: "Actividad no encontrada" })

    // Actualizar estadísticas del día (restar valores)
    const datosDelDia = getDatosDelDia(usuario, actividad.fecha)
    datosDelDia.estadisticas.minutosActividad -= actividad.duracion
    datosDelDia.estadisticas.caloriasQuemadas -= actividad.calorias

    // Eliminar actividad
    usuario.actividades.pull(activityId)

    await usuario.save()

    const userResponse = usuario.toObject()
    delete userResponse.contraseña

    res.json({
      msg: "Actividad eliminada exitosamente",
      user: userResponse,
    })
  } catch (err) {
    console.error("Error eliminando actividad:", err)
    res.status(500).json({ error: err.message })
  }
}

// Obtener historial por fecha
const obtenerHistorial = async (req, res) => {
  /*  #swagger.tags = ['Historial']
        #swagger.description = 'Obtener historial de actividades por fecha'
        #swagger.security = [{ "bearerAuth": [] }]
        #swagger.parameters['id'] = {
            in: 'path',
            description: 'ID del usuario',
            required: true,
            type: 'string'
        }
        #swagger.parameters['fecha'] = {
            in: 'query',
            description: 'Fecha en formato YYYY-MM-DD',
            required: true,
            type: 'string'
        }
        #swagger.responses[200] = {
            description: 'Historial obtenido exitosamente',
            schema: { $ref: '#/definitions/HistorialResponse' }
        }
        #swagger.responses[403] = { description: 'Acceso no autorizado' }
        #swagger.responses[404] = { description: 'Usuario no encontrado' }
    */
  try {
    const requestedId = req.params.id
    const fecha = req.query.fecha
    const tokenUserId = req.user.userId

    if (tokenUserId !== requestedId) return res.status(403).json({ msg: "Acceso no autorizado" })

    if (!fecha) return res.status(400).json({ msg: "Fecha es requerida" })

    const usuario = await User.findById(requestedId)
    if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" })

    // Filtrar actividades por fecha
    const actividadesFecha = usuario.actividades.filter((act) => act.fecha === fecha)

    // Obtener datos del día
    const datosDelDia = usuario.datosPorDia.find((d) => d.fecha === fecha) || {
      fecha,
      comidas: { desayuno: null, comida: null, cena: null },
      estadisticas: { caloriasConsumidas: 0, minutosActividad: 0, caloriasQuemadas: 0 },
    }

    res.json({
      fecha,
      actividades: actividadesFecha,
      comidas: datosDelDia.comidas,
      estadisticas: datosDelDia.estadisticas,
    })
  } catch (err) {
    console.error("Error obteniendo historial:", err)
    res.status(500).json({ error: err.message })
  }
}

// Actualizar comidas
const actualizarComidas = async (req, res) => {
  /*  #swagger.tags = ['Nutrición']
        #swagger.description = 'Actualizar comidas del usuario'
        #swagger.security = [{ "bearerAuth": [] }]
        #swagger.parameters['id'] = {
            in: 'path',
            description: 'ID del usuario',
            required: true,
            type: 'string'
        }
        #swagger.parameters['body'] = {
            in: 'body',
            description: 'Datos de las comidas',
            required: true,
            schema: { $ref: '#/definitions/MealUpdate' }
        }
        #swagger.responses[200] = {
            description: 'Comidas actualizadas exitosamente',
            schema: { $ref: '#/definitions/UserResponse' }
        }
        #swagger.responses[403] = { description: 'Acceso no autorizado' }
        #swagger.responses[404] = { description: 'Usuario no encontrado' }
    */
  try {
    const requestedId = req.params.id
    const tokenUserId = req.user.userId

    if (tokenUserId !== requestedId) return res.status(403).json({ msg: "Acceso no autorizado" })

    const usuario = await User.findById(requestedId)
    if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" })

    const { fecha, tipoComida, comida } = req.body

    if (!fecha || !tipoComida || !comida) {
      return res.status(400).json({ msg: "Fecha, tipo de comida y datos de comida son requeridos" })
    }

    // Actualizar comidas del día
    const datosDelDia = getDatosDelDia(usuario, fecha)

    // Calcular diferencia de calorías
    let diferenciaCalorias = comida.calorias
    if (datosDelDia.comidas[tipoComida]) {
      diferenciaCalorias -= datosDelDia.comidas[tipoComida].calorias
    }

    datosDelDia.comidas[tipoComida] = comida
    datosDelDia.estadisticas.caloriasConsumidas += diferenciaCalorias

    // Actualizar comidas actuales del usuario
    usuario.comidas[tipoComida] = comida

    await usuario.save()

    const userResponse = usuario.toObject()
    delete userResponse.contraseña

    res.json({
      msg: "Comidas actualizadas exitosamente",
      user: userResponse,
    })
  } catch (err) {
    console.error("Error actualizando comidas:", err)
    res.status(500).json({ error: err.message })
  }
}

module.exports = {
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
}
