import express from 'express';
import { getFriendsList, getMessages, sendMessage } from '../controller/message.controller.js';
import { verifyToken,protectRoute } from '../middleware/protectRoute.js';
const router = express.Router();

router.get('/get/:userId',protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);
router.get("/getUserFriends", protectRoute, getFriendsList);





export default router;
