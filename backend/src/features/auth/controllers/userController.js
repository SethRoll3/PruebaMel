import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// Obtener todos los usuarios (filtrado por ubicación para admin_ubicacion)
export const getUsers = async (req, res) => {
  try {
    const { role, ubicacion } = req.user;
    let query = {};

    // Si es admin_ubicacion, solo puede ver usuarios de su ubicación
    if (role === 'admin_ubicacion') {
      query.ubicacion = ubicacion;
    }

    const users = await User.find(query).select('-password').populate('ubicacion', 'nombre');
    res.json(users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Crear un nuevo usuario
export const createUser = async (req, res) => {
  try {
    const { role: creatorRole, ubicacion: creatorUbicacion } = req.user;
    const { email, password, role, ubicacion } = req.body;

    // Validar que solo admin y admin_ubicacion puedan crear usuarios
    if (!['admin', 'admin_ubicacion'].includes(creatorRole)) {
      return res.status(403).json({ message: 'No tienes permisos para crear usuarios' });
    }

    // Validar que admin_ubicacion solo pueda crear usuarios para su ubicación
    if (creatorRole === 'admin_ubicacion' && ubicacion !== creatorUbicacion) {
      return res.status(403).json({ message: 'Solo puedes crear usuarios para tu ubicación' });
    }

    // Validar que el rol asignado sea válido según el creador
    if (creatorRole === 'admin_ubicacion' && role === 'admin') {
      return res.status(403).json({ message: 'No puedes crear usuarios administradores' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }

    const newUser = new User({
      email,
      password: bcrypt.hashSync(password),
      role,
      ubicacion: role === 'admin' ? undefined : ubicacion
    });

    await newUser.save();
    const userResponse = { ...newUser.toObject() };
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Actualizar un usuario
export const updateUser = async (req, res) => {
  try {
    const { role: updaterRole, ubicacion: updaterUbicacion } = req.user;
    const userId = req.params.id;
    const updateData = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Validar permisos de actualización
    if (updaterRole === 'admin_ubicacion') {
      if (user.ubicacion.toString() !== updaterUbicacion) {
        return res.status(403).json({ message: 'No puedes modificar usuarios de otras ubicaciones' });
      }
      if (updateData.role === 'admin') {
        return res.status(403).json({ message: 'No puedes asignar el rol de administrador' });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password');

    res.json(updatedUser);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Eliminar un usuario
export const deleteUser = async (req, res) => {
  try {
    const { role: deleterRole, ubicacion: deleterUbicacion } = req.user;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Validar permisos de eliminación
    if (deleterRole === 'admin_ubicacion') {
      if (user.ubicacion.toString() !== deleterUbicacion) {
        return res.status(403).json({ message: 'No puedes eliminar usuarios de otras ubicaciones' });
      }
      if (user.role === 'admin') {
        return res.status(403).json({ message: 'No puedes eliminar administradores' });
      }
    }

    await User.findByIdAndDelete(userId);
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Obtener un usuario específico
export const getUser = async (req, res) => {
  try {
    const { role, ubicacion: userUbicacion } = req.user;
    const userId = req.params.id;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Validar acceso para admin_ubicacion
    if (role === 'admin_ubicacion' && user.ubicacion.toString() !== userUbicacion) {
      return res.status(403).json({ message: 'No tienes acceso a este usuario' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};