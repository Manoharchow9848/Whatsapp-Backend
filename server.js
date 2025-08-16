import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from "cookie-parser";
import { connectDB } from './db/connectdb.js';
import authRoutes from './route/auth.route.js';
import messageRoutes from './route/message.route.js';
import {app,server} from './lib/socket.js'
dotenv.config();



// CORS
app.use(cors({
    origin: 'https://whats-app-frontend-rho.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// Increase body size limit
app.use(express.json({ limit: '2000mb' }));
app.use(express.urlencoded({ limit: '2000mb', extended: true }));
 
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/message', messageRoutes);

server.listen(process.env.PORT || 5000, async () => {
    await connectDB();
    console.log(`Server is running on port ${process.env.PORT || 5000}`);
});
