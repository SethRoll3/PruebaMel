import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, password)
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { 
        userId: user._id, 
        role: user.role,
        ubicacion: user.ubicacion
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        ubicacion: user.ubicacion
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const defaultUser = async () => {
  try {
    const adminPassword = await bcrypt.hash('admin123', 10);
    let data = {
      email: 'admin@gmail.com',
      password: adminPassword,
      role: 'admin',
      ubicacion: '680b8acc93df9890caa65f4f'
    };
    let user = new User(data);
    await user.save();
    return console.log('Updated user', data); 
  } catch (err) {
    console.error(err);
  }
};
