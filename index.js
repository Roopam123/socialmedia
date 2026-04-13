import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import connectDB from './utils/connectDB.js';
import userRoutes from './routes/user.route.js';
import postRoutes from './routes/post.route.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Connect Database
connectDB();

// middleware
const corsOptions = {
    origin: 'http://localhost:5173',
    credentials: true,
};

app.use(cors(corsOptions));
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

// start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});