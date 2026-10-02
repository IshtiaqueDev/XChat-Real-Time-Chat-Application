const express=require("express");
const http=require("http");
const mongoose=require("mongoose");
const cors=require("cors");
const connectDB=require("./config/db")
const session=require("express-session");
const UserRoute=require("./routes/User");
const User=require("./models/User");
const Chat=require("./models/Chat");
const passport=require("passport");
const {Server}=require("socket.io");
const port=5000;
const frontendOrigins=["http://localhost:5173","http://localhost:5174"];

const app=express();

app.use(cors({
    origin:frontendOrigins,
    credentials:true
}))

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sessionMiddleware=session({
    secret:"mysupersecretcode",
    resave:false,
    saveUninitialized:true,
    cookie:{
        maxAge:7 * 24 * 600 * 60 * 1000,
        httpOnly:true,
        secure:process.env.NODE_ENV === "production",
        sameSite:process.env.NODE_ENV === "production" ? "none" : "lax"
    }
});

app.use(sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());

passport.use(User.createStrategy());

passport.serializeUser((user,done)=>{
    done(null,user._id);
})

passport.deserializeUser(async(id,done)=>{
    try {
        const user = await User.findById(id);
        done(null, user);
  } catch (err) {
        done(err);
  }
})


app.use("/user",UserRoute);


app.use((err, req, res, next) => {
    const isExistingUsername = err.name === "UserExistsError";
    res.status(isExistingUsername ? 409 : 500).json({
        message: isExistingUsername ? "That username is already taken." : err.message || "Internal Server Error"
    });
});


const server=http.createServer(app);
const io=new Server(server,{
    cors:{
        origin:frontendOrigins,
        credentials:true
    }
});
const onlineUsers=new Map();

io.engine.use(sessionMiddleware);
io.engine.use(passport.initialize());
io.engine.use(passport.session());

io.use((socket,next)=>{
    if(socket.request.isAuthenticated?.()) return next();
    next(new Error("Unauthorized"));
});

io.on("connection",(socket)=>{
    const senderId=String(socket.request.user._id);
    const activeSocketCount=onlineUsers.get(senderId) || 0;
    onlineUsers.set(senderId,activeSocketCount+1);
    socket.join(`user:${senderId}`);
    socket.emit("presence:list",Array.from(onlineUsers.keys()));
    if(activeSocketCount === 0){
        io.emit("presence:changed",{userId:senderId,online:true});
    }
    console.log(`Socket connected: ${senderId}`);

    socket.on("chat:send",async(payload,acknowledge)=>{
        const reply=(result)=>{
            if(typeof acknowledge === "function") acknowledge(result);
        };
        const recipientId=typeof payload?.recipientId === "string" ? payload.recipientId : "";
        const message=typeof payload?.message === "string" ? payload.message.trim() : "";

        if(!mongoose.isValidObjectId(recipientId)) return reply({ok:false,message:"Invalid recipient"});
        if(senderId === recipientId.toLowerCase()) return reply({ok:false,message:"You cannot message yourself"});
        if(!message) return reply({ok:false,message:"Message cannot be empty"});
        if(message.length > 4000) return reply({ok:false,message:"Messages must be 4,000 characters or fewer"});

        try{
            const recipient=await User.findById(recipientId).select("_id");
            if(!recipient) return reply({ok:false,message:"Recipient not found"});

            const savedChat=await Chat.create({
                from:socket.request.user._id,
                to:recipient._id,
                message
            });
            const chat={
                _id:String(savedChat._id),
                from:String(savedChat.from),
                to:String(savedChat.to),
                message:savedChat.message,
                atTime:savedChat.atTime.toISOString()
            };

            io.to(`user:${senderId}`).to(`user:${String(recipient._id)}`).emit("chat:message",chat);
            reply({ok:true,chat});
        }catch(error){
            console.error("Socket message failed:",error.message);
            reply({ok:false,message:"Message could not be saved"});
        }
    });

    socket.on("chat:read",async(payload,acknowledge)=>{
        const senderIdToRead=typeof payload?.senderId === "string" ? payload.senderId : "";
        if(!mongoose.isValidObjectId(senderIdToRead) || senderIdToRead.toLowerCase() === senderId){
            if(typeof acknowledge === "function") acknowledge({ok:false});
            return;
        }

        try{
            await Chat.updateMany(
                {from:senderIdToRead,to:socket.request.user._id,readAt:null},
                {$set:{readAt:new Date()}}
            );
            io.to(`user:${senderId}`).emit("chat:read",{senderId:senderIdToRead});
            if(typeof acknowledge === "function") acknowledge({ok:true});
        }catch(error){
            console.error("Socket read receipt failed:",error.message);
            if(typeof acknowledge === "function") acknowledge({ok:false});
        }
    });

    socket.on("disconnect",(reason)=>{
        const remainingSockets=(onlineUsers.get(senderId) || 1)-1;
        if(remainingSockets <= 0){
            onlineUsers.delete(senderId);
            io.emit("presence:changed",{userId:senderId,online:false});
        }else{
            onlineUsers.set(senderId,remainingSockets);
        }
        console.log(`Socket disconnected: ${senderId} (${reason})`);
    });
});

server.listen(port,"0.0.0.0",()=>{
    console.log("Server is Listening...");
});
