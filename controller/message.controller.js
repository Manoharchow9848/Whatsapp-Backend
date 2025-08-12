import User from "../model/user.model.js";
import Message from "../model/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

const areFriends = async (userId1, userId2) => {
  const user = await User.findById(userId1).select("friends");
  if (!user) return false;
  return user.friends.some(friendId => friendId.toString() === userId2.toString());
};

export const getFriendsList = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const user = await User.findById(currentUserId)
      .populate({
        path: "friends",
        select: "name email phoneNumber profilePicture about _id", // only needed fields, no _id if you don't need it
      })
      .select("-password -friends -friendRequestsSent -friendRequestsReceived -__v");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.friends);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



export const getMessages = async (req, res) => {
  const { userId } = req.params; // friend ID
  const currentUserId = req.user._id; // logged-in user ID

  try {
  
    const friendsCheck = await areFriends(currentUserId, userId);
    if (!friendsCheck) {
      return res.status(403).json({ message: "You are not friends with this user." });
    }

    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: userId },
        { senderId: userId, receiverId: currentUserId }
      ]
    });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const sendMessage = async (req, res) => {
  try {
    const currentUserId = req.user._id; 
    const { text, image } = req.body; 
    const { id: receiverId } = req.params; 

    const friendsCheck = await areFriends(currentUserId, receiverId);
    if (!friendsCheck) {
      return res.status(403).json({ message: "You can only send messages to friends." });
    }

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url; 
    }

    const newMessage = new Message({
      senderId: currentUserId,
      receiverId,
      text,
      image: imageUrl 
    });

     await newMessage.save();

    // TODO: socket.io logic to emit new message
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }
    res.status(200).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
