import express from "express";

import {
    login,
    register
} from "../controllers/auth.controller.js";
import { verifyToken } from "../utils/helper/jwt.token.helper.js";

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/verify', verifyToken, (req, res) => res.status(200).json({ message: 'Token is valid' }));

export default router;