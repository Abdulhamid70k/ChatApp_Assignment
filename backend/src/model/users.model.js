//src/models/users.model.js
import mongoose from "mongoose";
import { addPasswordHooks } from '../utils/hooks/password.hooks.js';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    userName: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    role: { type: String, default: 'user' },

}, { timestamps: true });

addPasswordHooks(userSchema);

export default mongoose.model('User', userSchema);