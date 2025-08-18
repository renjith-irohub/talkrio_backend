const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    unique:true,
        minLength:[5,"Minimum 5 characters required"],
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    minLength:[5,"Minimum 5 characters required"]
  },
  role: { 
    type: String, 
    enum: ["moderator", "individual","psychiatrist"], 
    default: "individual" 
  },
  blocked:{
    type:Boolean,
    default:false
  },

  reports:{
    type:Number,
    default:0
  },
  verified:{
    type:Boolean,
    default:true
  },
  plan: {
    type: String,
    enum: ["basic", "standard","vip"],
    required: function () {
      return this.paymentType === "subscription";
    },
  },
  resume:{
    type: String, 
},
resetPasswordToken:{
  type:String
 },

  recentActivity: [
    {
        postId: mongoose.Schema.Types.ObjectId,
        action: String, // "like", "comment", "view"
        timestamp: { type: Date, default: Date.now }
    }
]
});


const User = mongoose.model("User", UserSchema);
module.exports = User;