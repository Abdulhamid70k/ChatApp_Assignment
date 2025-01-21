

import express from "express";

import {
    createGroup,
    getGroups,
    getGroup,
    addUserToGroup,
    myOwnedGroups,
    deleteGroup,
    leaveGroup
} from "../controllers/group.controller.js";

const router = express.Router();

import { verifyToken } from "../utils/helper/jwt.token.helper.js";

router.post('/create', verifyToken, createGroup);
router.post('/add-users', verifyToken, addUserToGroup);
router.get('/my-owned-groups', verifyToken, myOwnedGroups);
router.get('/my-groups', verifyToken, getGroups);
router.get('/groups', verifyToken, getGroup);
router.delete('/delete', verifyToken, deleteGroup);
router.delete('/leave', verifyToken, leaveGroup);

export default router;