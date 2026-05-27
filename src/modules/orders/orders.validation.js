const Joi = require('joi');

const createOrderSchema = Joi.object({
  orderData: Joi.object({
    customer_id: Joi.number().integer().allow(null).optional(),
    user_id: Joi.number().integer().allow(null).optional(),
    table_id: Joi.number().integer().allow(null).optional(),
    order_number: Joi.string().required(),
    order_type: Joi.string().valid('dine-in', 'takeaway', 'delivery', 'room service').required(),
    subtotal: Joi.number().required(),
    tax: Joi.number().required(),
    discount: Joi.number().default(0),
    serviceChargePercent: Joi.number().valid(0, 5, 10, 30).optional(),
    service_charge_percent: Joi.number().valid(0, 5, 10, 30).optional(),
    serviceChargeAmount: Joi.number().optional(),
    service_charge_amount: Joi.number().optional(),
    grand_total: Joi.number().required(),
    payment_status: Joi.string().optional(),
    order_status: Joi.string().optional(),
    notes: Joi.string().allow('', null).optional()
  }).required(),
  items: Joi.array().items(
    Joi.object({
      menu_item_id: Joi.number().integer().required(),
      quantity: Joi.number().integer().min(1).required(),
      unit_price: Joi.number().required(),
      total_price: Joi.number().required(),
      // Addon and size fields - optional but accepted
      addons: Joi.alternatives().try(
        Joi.string().allow('', null),
        Joi.array()
      ).optional().allow(null),
      size_name: Joi.string().allow('', null).optional(),
      size_price: Joi.number().allow(null).optional(),
      notes: Joi.string().allow('', null).optional()
    })
  ).min(1).required()
});

const updateOrderStatusSchema = Joi.object({
  status: Joi.string().valid('new', 'pending', 'cooking', 'ready', 'delivered', 'cancelled').required()
});

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema
};
