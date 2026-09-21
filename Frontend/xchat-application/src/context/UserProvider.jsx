import { useEffect } from "react";
import { useState } from "react";
import UserContext from "./UserContext";

function UserProvider({children}){
    const[user,setUser]=useState(null);

    const getUser=async()=>{
        try{
            let response=await axios.get("http://localhost:5173/user",{
                withCredentials:true
            });
            if(response.data.user){
                setUser(response.data.user);
            }else{
                console.log("User doesnot Exist");
            }
        }catch(err){

        }
    }

    useEffect(()=>{
        getUser();
    },[]);


    return(
        <>
        <UserContext.Provider >
            {children}
        </UserContext.Provider>
        </>
    )
}

export default UserProvider;