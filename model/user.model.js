// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: /.+\@.+\..+/,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: /^\d{10}$/,
    },
    password: { type: String, required: true, minlength: 6 },
    profilePicture: { type: String, default: "default.jpg" },
    about: { type: String, trim: true, maxlength: 500, default: "me" },

    
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    friendRequestsSent: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    friendRequestsReceived: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
