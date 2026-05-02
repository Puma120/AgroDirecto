/**
 * Product.js — Modelo de producto con stock real
 */
import mongoose from 'mongoose';

const producerSubSchema = new mongoose.Schema(
  {
    id:          String,
    name:        String,
    farmName:    String,
    location:    String,
    rating:      Number,
    reviewCount: Number,
    avatar:      String,
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    // Usamos el ID original (p1, p2…) como _id para compatibilidad con el frontend
    _id:                { type: String },
    name:               { type: String, required: true },
    category:           { type: String, required: true },
    price:              { type: Number, required: true },
    unit:               { type: String },
    minOrder:           { type: Number, default: 1 },
    maxOrder:           { type: Number },
    producer:           producerSubSchema,
    harvestDate:        String,
    origin:             String,
    stock:              { type: Number, default: 0 },
    image:              String,
    images:             [String],
    description:        String,
    freshnessHours:     Number,
    supermarketPrice:   Number,
    savings:            Number,
    tags:               [String],
    nutritionHighlights:[String],
    available:          { type: Boolean, default: true },
    stockLog:           [
      {
        delta:     Number,
        comment:   String,
        timestamp: { type: Date, default: Date.now },
        _id:       false,
      },
    ],
  },
  { _id: false, timestamps: true }
);

export default mongoose.model('Product', productSchema);
