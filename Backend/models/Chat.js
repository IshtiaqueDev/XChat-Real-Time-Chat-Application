const mongoose=require("mogoose");

const chatSchema=new mongoose.Schema({
    from:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
    },
    to:{
        type:mongooose.Schema.Types.ObjectId,
        ref:"User",
    },
    message:{
        type:String,
        required:true
    },
    atTime:{
        type:Date,
        defualt:Date.now()
    }
})

let Chat=mongoose.model("Chat",chatSchema);

module.exports=Chat;