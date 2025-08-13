const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'mi_clave_super_secreta';

/**
 * Middleware para verificar JWT y proteger rutas
 */
function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(403).json({ message: 'Token requerido' });

    const token = authHeader.split(' ')[1]; // Bearer <token>
    if (!token) return res.status(403).json({ message: 'Token requerido' });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(403).json({ message: 'Token inválido o expirado' });
        req.user = decoded;
        next();
    });
}

/**
 * Función auxiliar para obtener o crear datosPorDia para una fecha
 */
function getDatosDelDia(usuario, fecha) {
    if (!Array.isArray(usuario.datosPorDia)) usuario.datosPorDia = [];

    let datos = usuario.datosPorDia.find(d => d.fecha === fecha);
    if (!datos) {
        datos = {
            fecha,
            comidas: { desayuno: null, comida: null, cena: null },
            estadisticas: { caloriasConsumidas: 0, minutosActividad: 0, caloriasQuemadas: 0 }
        };
        usuario.datosPorDia.push(datos);
    }
    return datos;
}

// Registro (público)
router.post('/register', async (req, res) => {
    try {
        const { nombre, email, password } = req.body;
        if (!nombre || !email || !password) {
            return res.status(400).json({ msg: 'Todos los campos son obligatorios' });
        }

        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ msg: 'El email ya está registrado' });

        const newUser = new User({
            nombre,
            email,
            contraseña: password,
            actividades: [],
            comidas: { desayuno: null, comida: null, cena: null },
            estadisticas: { caloriasConsumidas: 0, minutosActividad: 0, caloriasQuemadas: 0 },
            datosPorDia: []
        });

        await newUser.save();

        const userResponse = newUser.toObject();
        delete userResponse.contraseña;

        res.status(201).json({
            msg: 'Usuario registrado exitosamente',
            user: userResponse
        });
    } catch (err) {
        console.error('Error en registro:', err);
        res.status(500).json({ error: err.message });
    }
});

// Login (público) - retorna token JWT y user info sin contraseña
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if(!email || !password) {
            return res.status(400).json({ msg: 'Email y contraseña son requeridos' });
        }

        const usuario = await User.findOne({ email, contraseña: password });
        if (!usuario) return res.status(401).json({ msg: 'Credenciales inválidas' });

        // Generar token JWT
        const token = jwt.sign(
            { userId: usuario._id, email: usuario.email, nombre: usuario.nombre },
            SECRET_KEY,
            { expiresIn: '1h' }
        );

        const userResponse = usuario.toObject();
        delete userResponse.contraseña;

        res.json({ token, user: userResponse });
    } catch (err) {
        console.error("Error en login:", err);
        res.status(500).json({ error: err.message });
    }
});

// Obtener usuario por ID (protegido)
router.get('/:id', verificarToken, async (req, res) => {
    try {
        const requestedId = req.params.id;
        const tokenUserId = req.user.userId;

        if (tokenUserId !== requestedId) return res.status(403).json({ msg: 'Acceso no autorizado' });

        const usuario = await User.findById(requestedId);
        if (!usuario) return res.status(404).json({ msg: 'Usuario no encontrado' });

        const userResponse = usuario.toObject();
        delete userResponse.contraseña;

        res.json(userResponse);
    } catch (err) {
        console.error("Error obteniendo usuario:", err);
        res.status(500).json({ error: err.message });
    }
});

// Actualizar usuario (protegido)
router.put('/:id', verificarToken, async (req, res) => {
    try {
        const requestedId = req.params.id;
        const tokenUserId = req.user.userId;

        if (tokenUserId !== requestedId) return res.status(403).json({ msg: 'Acceso no autorizado' });

        const usuario = await User.findById(requestedId);
        if (!usuario) return res.status(404).json({ msg: 'Usuario no encontrado' });

        const { actividades, comidas, estadisticas, datosPorDia } = req.body;

        if (actividades) usuario.actividades = actividades;
        if (comidas) usuario.comidas = comidas;
        if (estadisticas) usuario.estadisticas = estadisticas;
        if (datosPorDia) usuario.datosPorDia = datosPorDia;

        await usuario.save();

        const userResponse = usuario.toObject();
        delete userResponse.contraseña;

        res.json(userResponse);
    } catch (err) {
        console.error("Error actualizando usuario:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
