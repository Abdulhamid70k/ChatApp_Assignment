//src/routes/index.js
import express from "express";
import authRoutes from "./auth.routes.js";
import groupRoutes from './group.routes.js'
import userRoutes from "./users.routes.js";

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/group', groupRoutes);
router.use('/users', userRoutes);

export default router;
