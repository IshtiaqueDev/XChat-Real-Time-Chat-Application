import { useContext } from "react";
import { useNavigate } from 'react-router-dom';

function ProtectedRoute({children}){
    const{user}=useContext(u);
    
    const navigate=useNavigate();
    if(user){
            return children;
    }
    if(!user){
        navigate("/login");
    }
}

export default ProtectedRoute;