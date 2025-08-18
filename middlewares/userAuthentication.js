const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
require("dotenv").config();

const userAuthentication = async (req, res, next) => {
    try {
        // Check if authorization header exists and get token
        if (!req.headers["authorization"]) {
            throw new Error("No authorization header provided");
        }
        
        const token = req.headers["authorization"].split(" ")[1];
        if (!token) {
            throw new Error("User not authenticated - No token provided");
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        
        // Add user data to request object
        req.user = {
            email: decoded.email,
            id: decoded.id,
            role:decoded.role
        };

        // Find user in database
        const user = await User.findById(decoded.id);
        if (!user) {
            throw new Error("User not found");
        }

        // Check if user is blocked
        if (user.blocked) {
            throw new Error("User blocked");
        }

        // Proceed to next middleware
        next();
    } catch (error) {
        // Handle different types of errors
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "Invalid token"
            });
        }
        
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token expired"
            });
        }

        // Handle custom errors
        return res.status(401).json({
            success: false,
            message: error.message || "Authentication failed"
        });
    }
};

module.exports = userAuthentication;