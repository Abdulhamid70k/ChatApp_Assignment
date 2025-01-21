
import usersModel from "../model/users.model.js";
import { setServerError, setSuccess, setNotFound, setCreated, setBadRequest, setUnauthorized, setConflict } from "../utils/api/response.handler.js";
import { validateUserId, validateGroupId } from "../utils/helper/validate.helper.js";

export const myProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await validateUserId(userId);
        if (!user) {
            return setNotFound(res, 'User not found');
        }
        return setSuccess(res, 'User found successfully', user);
    } catch (error) {
        console.error('User creation error:', error);
        return setServerError(res, 'Error occurred during user creation');
    }
}

export const fetch10Users = async (req, res) => {
    try {
        const users = await usersModel.find().limit(10);
        return setSuccess(res, 'Users, Limit of 10', users);
    } catch (error) {
        console.error('User creation error:', error);
        return setServerError(res, 'Error occurred during user creation');
    }
}