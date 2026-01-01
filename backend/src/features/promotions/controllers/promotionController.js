import Promotion from '../models/Promotion.js';

export const createPromotion = async (req, res) => {
  try {
    const promotionData = req.body;
    const promotion = new Promotion(promotionData);
    await promotion.save();
    res.status(201).json(promotion);
  } catch (error) {
    console.error('Error al crear promoción:', error);
    res.status(500).json({ message: 'Error al crear la promoción' });
  }
};

export const getPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find()
      .populate({
        path: 'products.productId',
        populate: {
          path: 'location',
          select: 'nombre'
        }
      });
    res.json(promotions);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener promociones' });
  }
};

export const getActivePromotions = async (req, res) => {
  try {
    const now = new Date();
    const promotions = await Promotion.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).populate('products.productId');
    res.json(promotions);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener promociones activas' });
  }
};

export const getPromotionsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const now = new Date();
    
    const promotions = await Promotion.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      'products.productId': productId
    }).populate('products.productId');
    
    res.json(promotions);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener promociones del producto' });
  }
};

export const updatePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const promotion = await Promotion.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!promotion) {
      return res.status(404).json({ message: 'Promoción no encontrada' });
    }
    
    res.json(promotion);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar la promoción' });
  }
};

export const deletePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const promotion = await Promotion.findByIdAndDelete(id);
    
    if (!promotion) {
      return res.status(404).json({ message: 'Promoción no encontrada' });
    }
    
    res.json({ message: 'Promoción eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar la promoción' });
  }
};

export const validatePromotion = async (req, res) => {
  try {
    const { products, total } = req.body;
    const now = new Date();
    
    const activePromotions = await Promotion.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).populate('products.productId');

    const applicablePromotions = activePromotions.filter(promotion => {
      // Verificar condición de compra mínima
      if (promotion.conditions.minimumPurchase > total) {
        return false;
      }

      // Verificar límite de usos
      if (promotion.conditions.maxUses && 
          promotion.conditions.usedCount >= promotion.conditions.maxUses) {
        return false;
      }

      // Verificar productos y cantidades para promociones NxM
      if (promotion.promotionType === 'NxM') {
        return promotion.products.every(promotionProduct => {
          const cartProduct = products.find(p => 
            p.productId.toString() === promotionProduct.productId._id.toString()
          );
          return cartProduct && cartProduct.quantity >= promotion.nxmConfig.buyQuantity;
        });
      }

      // Para descuentos porcentuales o fijos
      return promotion.products.some(promotionProduct => {
        const cartProduct = products.find(p => 
          p.productId.toString() === promotionProduct.productId._id.toString()
        );
        return cartProduct && cartProduct.quantity >= promotionProduct.minimumQuantity;
      });
    });

    res.json(applicablePromotions);
  } catch (error) {
    res.status(500).json({ message: 'Error al validar promociones' });
  }
};