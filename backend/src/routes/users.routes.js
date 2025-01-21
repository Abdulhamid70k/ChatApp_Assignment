//src/routes/users.routes.js

import express from "express";

import {
    myProfile,
    fetch10Users
} from "../controllers/users.controller.js";
import { verifyToken } from "../utils/helper/jwt.token.helper.js"; 

const router = express.Router();

router.get('/my-profile', verifyToken, myProfile);
router.get('/fetch-10-users', verifyToken, fetch10Users);

export default router;
