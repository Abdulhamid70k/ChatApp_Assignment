// src/index.js
import dotenv from 'dotenv';
import { app } from "./app.js";
import { createServer } from 'http';
import connectDB from "./src/config/database.config.js";
import { initializeSocket } from './src/utils/socket/socket.handler.js';

dotenv.config({
    path: './.env'
});

const PORT = process.env.PORT || 3000;
const httpServer = createServer(app);


const io = initializeSocket(httpServer);


app.set('io', io);

connectDB()
    .then(() => {
        httpServer.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Socket.IO is ready for connections`);
        });
    })
    .catch((err) => {
        console.error("MongoDB connection error ", err);
    });


process.on('SIGTERM', () => {
    console.log('SIGTERM received. Closing HTTP server and Socket.IO connections...');
    httpServer.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});