const express=require("express");
const router=express.Router();
const wrapAsync=require("../utils/wrapAsync");

router.post("/signup",wrapAsync(async(req,res)=>{
    const formData=req.body;
    console.log(formData);
    res.json({
        message:"Signup Successfully!",
    })
}))

module.exports=router;