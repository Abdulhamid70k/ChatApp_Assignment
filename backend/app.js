//src/app.js
import express from 'express';
import cors from 'cors';

//Routes
import router from './src/routes/index.js';

const app = express()


app.use(
    cors({
        origin: (origin, callback) => {
        
            if (!origin || process.env.CORS_ORIGIN === '*') {
                callback(null, true); 
            } else if (process.env.CORS_ORIGIN.split(',').includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true 
    })
);


//common middleware 
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(express.static("public"));


//Routes
app.use('/v1/api', router);


export { app };