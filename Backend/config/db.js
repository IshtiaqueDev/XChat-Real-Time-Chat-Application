const mongoose=require("mongoose");

async function main(){
    await mongoose.connect("mongodb://localhost:27017/XChatApp");
}

main().then(()=>{
    console.log("Database Connected Successfully...");
}).catch((err)=>{
    console.log("The error is: ",err);
})

module.exports=main;