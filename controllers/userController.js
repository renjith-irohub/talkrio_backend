const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const asyncHandler=require("express-async-handler")
const express=require('express');
const User = require("../models/userModel");
const Psychiatrist = require("../models/psychiatristModel");
const crypto = require("crypto");
const nodemailer = require('nodemailer');

const userController={
    register: asyncHandler(async (req, res) => {
        const { username, email, password, role } = req.body;
        const userExists = await User.findOne({ email });
        if (userExists) {
          throw new Error("User already exists");
        }
      
        const hashed_password = await bcrypt.hash(password, 10);
      
        // Log the Cloudinary upload result
        if (req.file) {
          console.log("Cloudinary Upload Result:", req.file);
        }
      
        const userCreated = await User.create({
          username,
          email,
          password: hashed_password,
          role,
          resume: req.file?.path, // Ensure this is the correct Cloudinary URL
        });
      
        if (!userCreated) {
          throw new Error("User creation failed");
        }
      
        if (role === "psychiatrist") {
          await Psychiatrist.create({
            user: userCreated._id,
          });
          userCreated.verified = false;
          await userCreated.save();
        }
      
        const payload = {
          name: userCreated.username,
          email: userCreated.email,
          role: userCreated.role,
          id: userCreated.id,
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: "7d" });
        res.json(token);
      }),
  
    login :asyncHandler(async(req,res)=>{
        const {username,password}=req.body
        const userExist=await User.findOne({username})
        if(!userExist){
            throw new Error("User not found")
        }
        if(!userExist.verified){
            throw new Error("User not verified")
        }
        const passwordMatch=await bcrypt.compare(password, userExist.password)
        if(!passwordMatch){
            throw new Error("Passwords not matching")
        }
        const payload={
            name:userExist.username,  
            email:userExist.email,
            role:userExist.role,
            id:userExist.id
        }
        const token=jwt.sign(payload,process.env.JWT_SECRET_KEY)
        res.json(token)
  
        }),

    logout:asyncHandler(async(req,res)=>{
        res.clearCookie("token")
        res.send("User logged out")
        }),

    profile:asyncHandler(async (req, res) => {
        const { username, email, password, role} = req.body;
        const { userId } = req.user.id; 
        const user = await User.findOne({id:userId});
        if (!user) {
            throw new Error("User not found");
        }  
        let hashed_password = user.password; 
        if (password) {
            hashed_password = await bcrypt.hash(password, 10);
        }
        user.username = username || user.username;
        user.password = hashed_password;
        user.role = role || user.role;
        const updatedUser = await user.save();    
        if(!updatedUser){
            res.send('Error in updating')
        }
        res.send(user);
    }),

    forgotPassword : asyncHandler(async (req, res) => {
      const { email } = req.body;
      const user = await User.findOne({ email });
  
      if (!user) {
          return res.status(404).json({ message: "User not found" });
      }
  
      // Generate Reset Token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  
      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiry
      await user.save();
  
      // Email setup
      const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
          },
      });
  
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`;
  
      const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: "Password Reset Request",
          text: `Click on this link to reset your password: ${resetLink}`,
      };
  
      transporter.sendMail(mailOptions, (err, info) => {
          if (err) {
              console.error("Email error:", err);
              return res.status(500).json({ message: "Email could not be sent" });
          }
          res.json({ message: "Reset link sent to your email" });
      });
  }),
  
  resetPassword :asyncHandler(async (req, res) => {
      const { email, token, newPassword } = req.body;
      const user = await User.findOne({ email });
 console.log(user)
      if (!user || !user.resetPasswordToken) {
          return res.status(400).json({ message: "Invalid or expired token" });
      }
  
      const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  
      if (user.resetPasswordToken !== hashedToken || user.resetPasswordExpires < Date.now()) {
          return res.status(400).json({ message: "Invalid or expired token" });
      }
  
      user.password = await bcrypt.hash(newPassword, 10);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
  
      res.json({ message: "Password reset successful" });
  }),


    getUserProfile : asyncHandler(async (req, res) => {
        const userId = req.user.id;     
        const user = await User.findById(userId).select("-password"); 
        if (!user) {
            throw new Error("User not found");
        }    
        res.send({
            message: "User details retrieved successfully",
            user
        });
    })
}
module.exports=userController