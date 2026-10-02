import { useContext } from "react";
import UserContext from "../context/UserContext";
import { Navigate } from "react-router-dom";

function RedirectDashboard({children}){
    const {user,loading}=useContext(UserContext);
    if(loading) return <div className="route-loading">Loading your account...</div>;
    if(user) return <Navigate to="/dashboard" replace />;
    return children;
}

export default RedirectDashboard;