import usersModel from "../model/users.model.js"
import groupsModel from "../model/groups.model.js"
import messageModel from "../model/messages.model.js"
import { setBadRequest, setServerError, setSuccess, setNotFound, setCreated, setUnauthorized } from "../utils/api/response.handler.js";
import { validateGroupId, validateUserId } from "../utils/helper/validate.helper.js";

export const createGroup = async (req, res) => {
    try {
        const userId = req.user.userId;

        const user = await validateUserId(userId);

        if (!user) {
            return setNotFound(res, 'User not found');
        }

        const { name, description, members } = req.body;

        if (!name) {
            return setBadRequest(res, 'Group name is required');
        }
        if (!description) {
            return setBadRequest(res, 'Group description is required');
        }

        const group = await groupsModel.create({ name, description, createdBy: userId, members });

        return setSuccess(res, 'Group created successfully', group);

    } catch (error) {
        console.error('Group creation error:', error);
        return setServerError(res, 'Error occurred during group creation');
    }
}

export const addUserToGroup = async (req, res) => {
    try {
        const userId = req.user.userId;

        const user = await validateUserId(userId);
        if (!user) {
            return setNotFound(res, 'User not found');
        }

        const { groupId, usersToAdd } = req.body;

        const group = await validateGroupId(groupId);

        if (!group) {
            return setNotFound(res, 'Group not found');
        }

        if (!group.createdBy.equals(userId)) {
            return setUnauthorized(res, 'You are not authorized to add users to this group');
        }

        const users = await usersModel.find({ _id: { $in: usersToAdd } });

        if (users.length !== usersToAdd.length) {
            return setNotFound(res, 'One or more users not found');
        }

        group.members.push(...usersToAdd);
        await group.save();

        return setSuccess(res, 'Users added to group successfully', group);

    } catch (error) {
        console.error('Add user to group error:', error);
        return setServerError(res, 'Error occurred while adding users to group');
    }
}

export const getGroups = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await validateUserId(userId);
        if (!user) {
            return setNotFound(res, 'User not found');
        }
        const groups = await groupsModel.find({ members: userId }).populate('members', 'name userName');
        return setSuccess(res, 'Groups found successfully', groups);
    } catch (error) {
        console.error('Group creation error:', error);
        return setServerError(res, 'Error occurred during group creation');
    }
}

export const getGroup = async (req, res) => {
    try {
        const groupId = req.query.groupId;

        
        const group = await validateGroupId(groupId);
        if (!group) {
            return setNotFound(res, 'Group not found');
        }

       
        const populatedGroup = await groupsModel.findById(group._id)
            .populate('members', 'name userName')
            .exec();

        if (!populatedGroup) {
            return setNotFound(res, 'Group not found after population');
        }

        return setSuccess(res, 'Group found successfully', populatedGroup);

    } catch (error) {
        console.error('Error fetching group:', error);
        return setServerError(res, 'Error occurred during group fetching');
    }
};

export const myOwnedGroups = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await validateUserId(userId);
        if (!user) {
            return setNotFound(res, 'User not found');
        }
        const groups = await groupsModel.find({ createdBy: userId });
        return setSuccess(res, 'Groups found successfully', groups);
    } catch (error) {
        console.error('Group creation error:', error);
        return setServerError(res, 'Error occurred during group creation');
    }
}

export const getGroupMessages = async (req, res) => {
    try {
        const { groupId } = req.query;
        const group = await validateGroupId(groupId);
        if (!group) {
            return setNotFound(res, 'Group not found');
        }

        if (!group.members.includes(req.user.userId)) {
            return setUnauthorized(res, 'You are not a member of this group');
        }


        return setSuccess(res, 'Messages retrieved successfully', messages);
    } catch (error) {
        console.error('Group creation error:', error);
        return setServerError(res, 'Error occurred during group creation');
    }
}

export const deleteGroup = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Validate user
        const user = await validateUserId(userId);
        if (!user) {
            return setNotFound(res, 'User not found');
        }

        const { groupId } = req.body;

        if (!groupId) {
            return setBadRequest(res, 'Group ID is required');
        }

    
        const group = await validateGroupId(groupId);
        if (!group) {
            return setNotFound(res, 'Group not found');
        }

       
        if (group.createdBy.toString() !== userId.toString()) {
            return setUnauthorized(res, 'You are not authorized to delete this group');
        }

       
        await messageModel.deleteMany({ sentToGroup: groupId });

      
        await groupsModel.findByIdAndDelete(groupId);

        return setSuccess(res, 'Group deleted successfully');
    } catch (error) {
        console.error('Delete group error:', error);
        return setServerError(res, 'An error occurred while deleting the group');
    }
};


export const leaveGroup = async (req, res) => {
    try {
        const userId = req.user.userId;

  
        const user = await validateUserId(userId);
        if (!user) {
            return setNotFound(res, 'User not found');
        }

        const { groupId } = req.body;

        if (!groupId) {
            return setBadRequest(res, 'Group ID is required');
        }

        const group = await validateGroupId(groupId);
        if (!group) {
            return setNotFound(res, 'Group not found');
        }

        if (!group.members.includes(userId)) {
            return setUnauthorized(res, 'You are not a member of this group');
        }

        if (group.createdBy.toString() === userId.toString()) {
            return setBadRequest(
                res,
                'As the creator of this group, you cannot leave it. If you wish to delete the group, please use the delete group feature.'
            );
        }

        
        group.members = group.members.filter((member) => member.toString() !== userId.toString());
        await group.save();

        return setSuccess(res, 'You have left the group successfully');
    } catch (error) {
        console.error('Leave group error:', error);
        return setServerError(res, 'An error occurred while trying to leave the group');
    }
};