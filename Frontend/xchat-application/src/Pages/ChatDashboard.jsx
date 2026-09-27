import axios from "axios";
import { useEffect, useState } from "react";

function ChatDashboard(){
    const[user, SetUsers]=useState(null);

    useEffect(()=>{
        
    })

    const loadUsers=()=>{
        try{
            let response=axios.get("",{
                withCredentials:true
            })
        }catch(err){

        }
    }

    return(
        <>
        <div className="container">
            <div className="row">
                <div className="col-md-6">

                </div>
                <div className="col-md-6"></div>
            </div>
        </div>
        </>
    )
}

export default ChatDashboard;