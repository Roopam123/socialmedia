import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import connectDB from './utils/connectDB.js';
import userRoutes from './routes/user.route.js';
import postRoutes from './routes/post.route.js';
import messageRoutes from './routes/message.route.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

// middleware
app.use(cors({
    origin: '*',
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// routes
app.get('/', (req, res) => {
    res.send({
        success: true,
        message: 'I am coming from backend',
    });
});

// importing routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1/messages', messageRoutes);

// start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));