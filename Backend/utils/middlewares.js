const isLoggedIn=(req,res,next)=>{
    if(!req.isAuthenticated || !req.isAuthenticated()){
         return res.status(401).json({message:"Please log in before performing this action"});
    }
    next();
}

module.exports={isLoggedIn};