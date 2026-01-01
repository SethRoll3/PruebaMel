import jwt from 'jsonwebtoken';

export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Token no proporcionado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Error verificando token:', error);
    return res.status(401).json({ message: 'Token inválido' });
  }
};

export const checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'No tienes permisos para realizar esta acción' });
    }
    next();
  };
};

export const checkUbicacion = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') {
      return next(); 
    }

    const ubicacionParam = req.query.ubicacion || req.body.ubicacion;
    
    if (!ubicacionParam) {
      return res.status(400).json({ message: 'Se requiere especificar una ubicación' });
    }

    if (req.user.role === 'admin_ubicacion' || req.user.role === 'employee') {
      if (req.user.ubicacion !== ubicacionParam) {
        return res.status(403).json({ message: 'No tienes acceso a esta ubicación' });
      }
    }

    next();
  } catch (error) {
    console.error('Error verificando ubicación:', error);
    return res.status(500).json({ message: 'Error al verificar ubicación' });
  }
};