/**
 * Order.js — Modelo de pedido
 */
import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    id:         String,
    name:       String,
    image:      String,
    price:      Number,
    unit:       String,
    qty:        Number,
    producer:   String,
    producerId: String,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // AGD-XXXXXX como _id para fácil lookup desde el frontend
    _id:               { type: String },
    userId:            { type: String, required: true, index: true },
    items:             [itemSchema],
    totals:            {
      subtotal:  Number,
      shipping:  Number,
      total:     Number,
      itemCount: Number,
    },
    deliveryInfo:      mongoose.Schema.Types.Mixed,
    paymentMethod:     String,
    status:            { type: String, default: 'confirmed' },
    closedAt:          { type: Date, default: null },   // se pone al entregar/cancelar
    estimatedDelivery: String,
    timeline:          [mongoose.Schema.Types.Mixed],
  },
  { _id: false, timestamps: true }
);

export default mongoose.model('Order', orderSchema);
