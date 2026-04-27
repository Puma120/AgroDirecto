/**
 * User.js — Modelo de usuario
 * Nota: usamos _id: String para preservar los IDs de los usuarios demo (u1, u2, u3, u4)
 */
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    _id:      { type: String },
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role:     { type: String, enum: ['consumer', 'producer', 'guest'], default: 'consumer' },
    farmName: { type: String },
    location: { type: String },
    phone:    { type: String },
    avatar:   { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
