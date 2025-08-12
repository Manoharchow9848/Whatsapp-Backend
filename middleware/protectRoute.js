import jwt from "jsonwebtoken";
import User from "../model/user.model.js";

export const protectRoute = async(req,res,next)=>{
    try {
       const token = req.cookies.jwt;
       
       
       if (!token) {
        return res.status(401).json({ error: "Unauthorized - No Token Provided" });
    }
    const decoded = jwt.verify(token,process.env.JWT_SECRET);
    if (!decoded) {
        return res.status(401).json({ error: "Unauthorized - Invalid Token" });
    }
    const user = await User.findById(decoded.userId).select("-password");

       if (!user) {
			return res.status(404).json({ error: "User not found" });
		}
        req.user = user;
        next();

    } catch (error) {
        console.log("Error in protectRoute middleware: ", error.message);
		res.status(500).json({ error: "Internal server error" });
    }
}
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
        
    req.user = decoded 
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

