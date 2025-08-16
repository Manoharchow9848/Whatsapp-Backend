import User from '../model/user.model.js'
import bcrypt from 'bcryptjs'
import jwt from "jsonwebtoken";
import cloudinary from "../lib/cloudinary.js";
export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // MS
    httpOnly: true, // prevent XSS attacks cross-site scripting attacks
    sameSite: "none", // CSRF attacks cross-site request forgery attacks
    secure: process.env.NODE_ENV !== "development",
  });

  return token;
};
export const registerUser = async (req, res) => {
      const {name,email,phoneNumber,password} = req.body;
      try {
            if (!name || !email || !phoneNumber || !password) {
                return res.status(400).json({ message: "All fields are required" });
            }
            if (password.length < 6) {
                return res.status(400).json({ message: "Password must be at least 6 characters long" });
            }
          const existingUser = await User.findOne({ email });
          if (existingUser) {
                return res.status(400).json({ message: "User already exists" });
            }
            const isPhoneNumberExists = await User.findOne({ phoneNumber });
            if (isPhoneNumberExists) {
                return res.status(400).json({ message: "Phone number already exists" });
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const profilePicture =`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
            const newUser = new User({
                name,
                email,
                phoneNumber,
                password: hashedPassword,
                profilePicture
            });

            await newUser.save();
            res.status(201).json({ message: "User registered successfully" });
      } catch (error) {
            console.error("Error registering user:", error); 
            res.status(500).json({ message: error });
          
      }
}
export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "User not authorized" });
        }
        const token = generateToken(user._id,res);

        res.status(200).json({ token, user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            profilePicture: user.profilePicture,
            about: user.about,
            friends: user.friends,
            friendRequestsSent: user.friendRequestsSent,
            friendRequestsReceived: user.friendRequestsReceived
        }});


}catch(error){
        console.error("Error logging in user:", error);
        res.status(500).json({ message: "Internal server error" });
}
}
export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
export const sendFriendRequest = async (req, res) => {
    const { id } = req.params; // ID of the receiver
  const senderId = req.user._id;

  if (senderId === id) return res.status(400).json({ msg: "You can't send a request to yourself" });

  const sender = await User.findById(senderId);
  const receiver = await User.findById(id);

  if (!receiver || !sender) return res.status(404).json({ msg: "User not found" });

  if (receiver.friendRequestsReceived.includes(senderId) || receiver.friends.includes(senderId)) {
    return res.status(400).json({ msg: "Request already sent or already friends" });
  }

  receiver.friendRequestsReceived.push(senderId);
  sender.friendRequestsSent.push(id);
  
  await receiver.save();
  await sender.save();

  res.json({ msg: "Friend request sent" });
}
export const acceptFriendRequest = async (req, res) => {
     const { id } = req.params; // ID of the sender
  const receiverId = req.user._id;

  const sender = await User.findById(id);
  const receiver = await User.findById(receiverId);

  if (!sender || !receiver) return res.status(404).json({ msg: "User not found" });

  // Remove from requests and add to friends
  receiver.friendRequestsReceived = receiver.friendRequestsReceived.filter(uid => uid.toString() !== id);
  sender.friendRequestsSent = sender.friendRequestsSent.filter(uid => uid.toString() !== receiverId);

  receiver.friends.push(id);
  sender.friends.push(receiverId);

  await sender.save();
  await receiver.save();

  res.json({ msg: "Friend request accepted" });
}
export const rejectFriendRequest = async (req, res) => {
    const { id } = req.params;
  const receiverId = req.user._id;

  const sender = await User.findById(id);
  const receiver = await User.findById(receiverId);

  receiver.friendRequestsReceived = receiver.friendRequestsReceived.filter(uid => uid.toString() !== id);
  sender.friendRequestsSent = sender.friendRequestsSent.filter(uid => uid.toString() !== receiverId);

  await sender.save();
  await receiver.save();

  res.json({ msg: "Friend request rejected" });

}
export const nonFriends = async (req, res) => {
    const userId = req.user._id;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  const excludeIds = [
    ...user.friends,
    ...user.friendRequestsSent,
    ...user.friendRequestsReceived,
    userId,
  ]; 

  const nonFriends = await User.find({ _id: { $nin: excludeIds } });

  res.json(nonFriends);
}

export const updateUser = async(req,res)=>{
    const { name, email, phoneNumber, about, profilePicture } = req.body;
    const userId = req.user._id;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (name) user.name = name;
        if (email) user.email = email;
        if (phoneNumber) user.phoneNumber = phoneNumber;
        if (about) user.about = about;
        
    if (profilePicture && profilePicture.startsWith("data:")) {
            const uploadResponse = await cloudinary.uploader.upload(profilePicture, {
                folder: "profile_pics",
                resource_type: "image"
            });
            user.profilePicture = uploadResponse.secure_url;
        }

        await user.save();
        res.status(200).json({ message: "User updated successfully", user });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}
export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};