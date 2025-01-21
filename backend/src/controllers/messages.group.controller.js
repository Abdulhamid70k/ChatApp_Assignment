// src/controllers/messages.group.controller.js
import messagesModel from "../model/messages.model.js";
import { validateGroupId } from "../utils/helper/validate.helper.js";
import { setSuccess, setNotFound, setUnauthorized } from "../utils/api/response.handler.js";

export const getGroupMessages = async (req, res) => {
    try {
        const { groupId } = req.query;
        const userId = req.user.userId; 

        const group = await validateGroupId(groupId);
        if (!group) {
            return setNotFound(res, 'Group not found');
        }

        
        if (!group.members.includes(userId)) {
            return setUnauthorized(res, 'You are not a member of this group');
        }

        
        const messages = await messagesModel.find({ sentToGroup: groupId })
            .populate('sender', 'name userName')
            .sort({ createdAt: 1 });

        return setSuccess(res, 'Messages retrieved successfully', messages);
    } catch (error) {
        return setServerError(res, error.message);
    }
};