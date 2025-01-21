import { Server } from 'socket.io';
import messagesModel from '../../model/messages.model.js';
import { validateUserId, validateGroupId } from '../helper/validate.helper.js';

let io;

export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        
        socket.on('authenticate', async ({ userId }) => {
            console.log('Authenticate request received:', { userId });
            try {
                const user = await validateUserId(userId);
                if (!user) {
                    console.error('Invalid user during authentication:', userId);
                    socket.emit('error', { message: 'Invalid user' });
                    return;
                }
                socket.join(`user:${userId}`);
                console.log('User authenticated and joined room:', `user:${userId}`);
                socket.emit('authenticated', { message: 'Successfully authenticated' });
            } catch (error) {
                console.error('Error during authentication:', error.message);
                socket.emit('error', { message: error.message });
            }
        });

       
        socket.on('joinGroup', async ({ userId, groupId }) => {
            console.log('Join group request received:', { userId, groupId });
            try {
                const group = await validateGroupId(groupId);
                if (!group || !group.members.includes(userId)) {
                    console.error('Not authorized to join group:', { userId, groupId });
                    socket.emit('error', { message: 'Not authorized to join this group' });
                    return;
                }
                socket.join(`group:${groupId}`);
                console.log('User joined group room:', `group:${groupId}`);
                socket.emit('joinedGroup', { groupId });
            } catch (error) {
                console.error('Error while joining group:', error.message);
                socket.emit('error', { message: error.message });
            }
        });

        
        socket.on('sendGroupMessage', async ({ senderId, groupId, message }) => {
            console.log('Send group message request received:', { senderId, groupId, message });
            try {
                const user = await validateUserId(senderId);
                const group = await validateGroupId(groupId);

                if (!user || !group) {
                    console.error('Invalid user or group for sending message:', { senderId, groupId });
                    socket.emit('error', { message: 'Invalid user or group' });
                    return;
                }

                if (!group.members.includes(senderId)) {
                    console.error('Unauthorized user trying to send message:', { senderId, groupId });
                    socket.emit('error', { message: 'User is not authorized to send messages to this group' });
                    return;
                }

                const newMessage = await messagesModel.create({
                    sender: senderId,
                    receiver: null,
                    sentToGroup: groupId,
                    message: message
                });

                const populatedMessage = await newMessage.populate([
                    { path: 'sender', select: 'name userName' }
                ]);

                console.log('New message saved to database:', populatedMessage);

                io.to(`group:${groupId}`).emit('newGroupMessage', {
                    messageId: populatedMessage._id,
                    sender: populatedMessage.sender,
                    message: populatedMessage.message,
                    groupId: populatedMessage.sentToGroup,
                    createdAt: populatedMessage.createdAt
                });
                console.log('Message emitted to group room:', `group:${groupId}`);
            } catch (error) {
                console.error('Error while sending group message:', error.message);
                socket.emit('error', { message: error.message });
            }
        });

        
        socket.on('getGroupMessages', async ({ groupId, page = 1, limit = 50 }) => {
            console.log('Get group messages request received:', { groupId, page, limit });
            try {
                const group = await validateGroupId(groupId);
                if (!group) {
                    console.error('Invalid group for fetching messages:', groupId);
                    socket.emit('error', { message: 'Invalid group' });
                    return;
                }

                const skip = (page - 1) * limit;
                const messages = await messagesModel.find({ sentToGroup: groupId })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate('sender', 'name userName')
                    .lean();

                const totalMessages = await messagesModel.countDocuments({ sentToGroup: groupId });
                const hasMore = totalMessages > skip + messages.length;

                console.log('Group messages fetched:', { groupId, page, totalMessages });
                socket.emit('groupMessageHistory', {
                    messages: messages.reverse(),
                    page,
                    hasMore,
                    totalMessages
                });
            } catch (error) {
                console.error('Error while fetching group messages:', error.message);
                socket.emit('error', { message: error.message });
            }
        });

      
        socket.on('markMessagesRead', async ({ userId, groupId, lastReadTimestamp }) => {
            console.log('Mark messages read request received:', { userId, groupId, lastReadTimestamp });
            try {
                const user = await validateUserId(userId);
                const group = await validateGroupId(groupId);

                if (!user || !group) {
                    console.error('Invalid user or group for marking messages read:', { userId, groupId });
                    socket.emit('error', { message: 'Invalid user or group' });
                    return;
                }

                socket.to(`group:${groupId}`).emit('messageReadStatus', {
                    userId,
                    groupId,
                    lastReadTimestamp
                });
                console.log('Message read status emitted to group room:', `group:${groupId}`);
            } catch (error) {
                console.error('Error while marking messages read:', error.message);
                socket.emit('error', { message: error.message });
            }
        });

       
        socket.on('typing', ({ userId, groupId, isTyping }) => {
            console.log('Typing status received:', { userId, groupId, isTyping });
            socket.to(`group:${groupId}`).emit('userTyping', {
                userId,
                groupId,
                isTyping
            });
            console.log('Typing status emitted to group room:', `group:${groupId}`);
        });

        
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.IO not initialized');
    }
    return io;
};
