//src/utils/helper/validate.helper.js
import mongoose from "mongoose";
import usersModel from "../../model/users.model.js";
import groupsModel from "../../model/groups.model.js";

export const validateUserId = async (userId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return false;
    }
    const user = await usersModel.findById(userId);
    if (!user) {
        return false;
    }
    return user;
}

export const validateGroupId = async (groupId) => {
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
        return false;
    }
    const group = await groupsModel.findById(groupId);
    if (!group) {
        return false;
    }
    return group;
}

export const validateMessageId = async (messageId) => {
    if (!mongoose.isValidObjectId.isValid(messageId)) {
        return false;
    }
    return true;
}
