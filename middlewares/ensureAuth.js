// middleware/auth.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const ensureAuth = async (req, res, next) => {

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ msg: "Token required*" });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ success: false, msg: 'No token' });
    }
    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('_id phone name');

        if (!user) {
            return res.status(401).json({ success: false, msg: 'Invalid token' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ success: false, msg: 'Token expired' });
    }
};
