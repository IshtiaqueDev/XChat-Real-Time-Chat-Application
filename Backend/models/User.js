const mongoose=require("mongoose");
const passport = require("passport");
const passportLocalMongoose=require("passport-local-mongoose").default;

const userSchema=new mongoose.Schema({
    email:{
        type:String,
        required:true
    }
})


userSchema.plugin(passportLocalMongoose);
let User=mongoose.model("User",userSchema);

module.exports=User;