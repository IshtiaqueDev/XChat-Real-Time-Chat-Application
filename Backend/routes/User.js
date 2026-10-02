const express=require("express");
const mongoose=require("mongoose");
const router=express.Router();
const User=require("../models/User");
const Chat=require("../models/Chat");
const passport=require("passport");
const wrapAsync=require("../utils/wrapAsync");
const {isLoggedIn}=require("../utils/middlewares");

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

router.get("/getall",isLoggedIn,wrapAsync(async(req,res)=>{
    const [users,conversations]=await Promise.all([
        User.find({_id:{$ne:req.user._id}}).select("username email").lean(),
        Chat.aggregate([
            {$match:{$or:[{from:req.user._id},{to:req.user._id}]}},
            {$sort:{atTime:-1}},
            {$group:{
                _id:{$cond:[{$eq:["$from",req.user._id]},"$to","$from"]},
                lastMessage:{$first:"$message"},
                lastMessageAt:{$first:"$atTime"},
                lastMessageFromMe:{$first:{$eq:["$from",req.user._id]}},
                unreadCount:{$sum:{$cond:[
                    {$and:[{$eq:["$to",req.user._id]},{$eq:[{$ifNull:["$readAt",null]},null]}]},
                    1,
                    0
                ]}}
            }}
        ])
    ]);
    const conversationsByUser=new Map(conversations.map((conversation)=>[
        String(conversation._id),
        conversation
    ]));
    const sortedUsers=users.map((user)=>({
        ...user,
        ...(conversationsByUser.get(String(user._id)) || {}),
        unreadCount:conversationsByUser.get(String(user._id))?.unreadCount || 0
    })).sort((first,second)=>{
        const firstMessageTime=first.lastMessageAt ? new Date(first.lastMessageAt).getTime() : 0;
        const secondMessageTime=second.lastMessageAt ? new Date(second.lastMessageAt).getTime() : 0;
        return secondMessageTime-firstMessageTime || first.username.localeCompare(second.username);
    });

    res.json({
        users:sortedUsers
    })
}));

router.get("/chat/:id",isLoggedIn,wrapAsync(async(req,res)=>{
    await Chat.updateMany(
        {from:req.params.id,to:req.user._id,readAt:null},
        {$set:{readAt:new Date()}}
    );
    const chats=await Chat.find({
        $or:[
            {from:req.user._id,to:req.params.id},
            {from:req.params.id,to:req.user._id}
        ]
    }).sort({atTime:1});

    res.json({chats});
}));

router.post("/chat/:id",isLoggedIn,wrapAsync(async(req,res)=>{
    const recipientId=req.params.id;
    const message=typeof req.body.message === "string" ? req.body.message.trim() : "";

    if(!mongoose.isValidObjectId(recipientId)){
        return res.status(400).json({message:"Invalid recipient"});
    }
    if(String(req.user._id) === recipientId){
        return res.status(400).json({message:"You cannot message yourself"});
    }
    if(!message){
        return res.status(400).json({message:"Message cannot be empty"});
    }
    if(message.length > 4000){
        return res.status(400).json({message:"Messages must be 4,000 characters or fewer"});
    }

    const recipient=await User.findById(recipientId);
    if(!recipient){
        return res.status(404).json({message:"Recipient not found"});
    }

    const chat=await Chat.create({
        from:req.user._id,
        to:recipient._id,
        message
    });

    res.status(201).json({chat});
}));

router.post("/login",wrapAsync(async(req,res,next)=>{
    passport.authenticate("local", (err, user) => {
        if (err) return next(err);
        if (!user) {
            return res.status(401).json({
                message: "Invalid username or password",
            });
        }
        req.login(user, (err) => {
            if (err) return next(err);
             res.json({
                message: "LoggedIn Successfully!",
                user:req.user
            });
        });
    })(req, res, next);
    
}))

router.post("/logout",isLoggedIn,(req,res,next)=>{
    req.logout((logoutError)=>{
        if(logoutError) return next(logoutError);

        req.session.destroy((sessionError)=>{
            if(sessionError) return next(sessionError);
            res.clearCookie("connect.sid",{
                httpOnly:true,
                secure:process.env.NODE_ENV === "production",
                sameSite:process.env.NODE_ENV === "production" ? "none" : "lax"
            });
            res.json({message:"Logged out successfully"});
        });
    });
});

router.get("/",wrapAsync(async(req,res)=>{
    res.json({user:req.user});
}))


module.exports=router;