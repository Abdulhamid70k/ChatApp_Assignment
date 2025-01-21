//src/controllers/auth.controller.js

import usersModel from "../model/users.model.js";
import { generateToken } from "../utils/helper/jwt.token.helper.js";
import { setSuccess, setCreated, setBadRequest, setServerError, setUnauthorized, setConflict, setNotFound } from "../utils/api/response.handler.js";
import { verifyToken } from "../utils/helper/jwt.token.helper.js";

export const register = async (req, res) => {
    try {
        const { name, email, userName, password } = req.body;

        const requiredFields = ['name', 'email', 'userName', 'password'];

        for (const field of requiredFields) {
            if (!req.body[field]) {
                return setBadRequest(res, `Field ${field} is required`);
            }
        }

        const existingUser = await usersModel.findOne({ email, userName });

        if (existingUser) {
            return setConflict(res, 'Email or User name is already in use');
        }

        const user = await usersModel.create({ name, email, userName, password });
        const token = await generateToken(user);

        return setCreated(res, 'User created successfully', { user, token });

    } catch (error) {
        console.error('Sign up error:', error);
        return setServerError(res, 'Error occurred during sign up');
    }
};

export const login = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return setBadRequest(res, 'Email/Username and password are required');
        }

        const user = await usersModel.findOne({ $or: [{ email: identifier }, { userName: identifier }] });

        if (!user) {
            return setNotFound(res, 'Invalid credentials');
        }

        if (!await user.comparePassword(password)) {
            return setUnauthorized(res, 'Invalid credentials');
        }

        const token = await generateToken(user);

        return setSuccess(res, 'Login successful', { user, token });

    } catch (error) {
        console.error('Login error:', error);
        return setServerError(res, 'Error occurred during login');
    }
};
