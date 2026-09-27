const express=require("express");
const router=express.Router();
const User=require("../models/User");
const wrapAsync=require("../utils/wrapAsync");

router.post("/signup",wrapAsync(async(req,res)=>{
    const formData=req.body;
    let user=await User.register({
        username:formData.username,
        email:formData.email
    },formData.password);

    console.log(user);
    
    res.json({
        message:"Signup Successfully!",
    })
}))

router.post("/login",wrapAsync(async(req,res)=>{
    const loginData=req.body;
    
}))

router.get("/",wrapAsync(async(req,res)=>{
    res.json({user:req.user});
}))


module.exports=router;