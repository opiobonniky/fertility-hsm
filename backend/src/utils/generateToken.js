import e from "express";
import jwt from "jsonwebtoken";

const generateToken = (userId, res) => {
    const playload = {
        id: userId,
    };

    const token = jwt.sign(playload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

    res.cookie("jwt", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24*7, // 7 days
    });

    return token;
}

export default generateToken;