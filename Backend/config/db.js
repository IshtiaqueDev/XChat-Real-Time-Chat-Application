const mongoose=require("mongoose");
const path=require("path");
require("dotenv").config({path:path.resolve(__dirname,"../.env")});

async function main(){
    const uri=process.env.MONGODB_URI;
    if(!uri){
        throw new Error("MONGODB_URI is missing. Add it to Backend/.env.");
    }
    await mongoose.connect(uri,{
        dbName:process.env.MONGODB_DB || "XChatApp"
    });
}

main().then(()=>{
    console.cllog("Database Connected Successfully...");
}).catch((err)=>{
    console.log("The error is: ",err);
})

module.exports=main;