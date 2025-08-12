import express from 'express';
import { registerUser,loginUser,sendFriendRequest,acceptFriendRequest,rejectFriendRequest,nonFriends, checkAuth, updateUser, logout } from '../controller/auth.controller.js';
import { verifyToken ,protectRoute} from '../middleware/protectRoute.js';
import User from '../model/user.model.js';
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post("/logout", logout);
router.put("/update-profile", protectRoute, updateUser);
router.get("/check", protectRoute, checkAuth);
router.post('/send-friend-request/:id', protectRoute, sendFriendRequest);
router.post('/accept-friend-request/:id', protectRoute, acceptFriendRequest);
router.post('/reject-friend-request/:id', protectRoute, rejectFriendRequest);
router.get('/non-friends', protectRoute,nonFriends);
router.get("/friend-requests", protectRoute, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("friendRequestsReceived", "name email phoneNumber profilePicture");
    res.status(200).json(user.friendRequestsReceived); 
  } catch (err) {
    res.status(500).json({ message: err });
  }
});
router.get("/get-user-friends",protectRoute,async(req,res)=>{
  try {
     
    const user = await User.findById(req.user._id).populate("friends", "name email phoneNumber about profilePicture");
    res.status(200).json(user.friends);

  } catch (error) {
    res.status(500).json({ message: error.message });

    
  }
})




export default router;