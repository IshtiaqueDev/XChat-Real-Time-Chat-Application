const express=require("express");
const cors=require("cors");
const connectDB=require("./config/db")
const session=require("express-session");
const UserRoute=require("./routes/User");
const passport=require("passport");
const port=5000;

const app=express();

app.use(cors({
    origin:"http://localhost:5173",
    credentials:true
}))

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret:"mysupersecretcode",
    resave:false,
    saveUninitialized:true,
    cookie:{
        maxAge:7 * 24 * 600 * 60 * 1000,
        httpOnly:true,
        secure:true,
        sameSite:"none"
    }
}))

app.use(passport.initialize());
app.use(passport.session());


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
  res.status(500).json({ err: err.message || "Internal Server Error" });
});


app.listen(port,"0.0.0.0",()=>{
    console.log("Server is Listening...");
})
