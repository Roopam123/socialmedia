import express from 'express';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import { sendMessage, getMessages } from '../controllers/message.controller.js';

const router = express.Router();


router.route('/send/:id').post(isAuthenticated, sendMessage);
router.route('/all/:id').get(isAuthenticated, getMessages);


export default router;