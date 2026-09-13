import React, { useState } from "react";

function LoginPage(){
    const initialState={
        username:"",
        password:""
    }
    const[formData,setFormData]=useState(initialState);
    return(
        <>
        <div className="container">
            <div className="row">
                <div className="col-md-6 bg-red text-center align-item">
                    <h5><span>X</span>Chat</h5>
                    <p>A Chat Application where you make new friends</p>
                 </div>
                
                <div className="col-md-6">
                    <div className="card">
                   <h3>Login Page</h3>
                   <form action="">
                    <label htmlFor="username">Uername:</label>
                    <input type="text" id="username" placeholder="exp:Hooria"/>
                    <br /><br />
                    <label htmlFor="password">Password:</label>
                    <input type="password" id="username" placeholder="exp: 1234"/>
                    <button>Login</button>
                    
                   </form>
                    <p>Not Logged In ? <a href="/signup">Signup</a></p>
                    </div>
              </div>
            </div>
        </div>
        </>
    )
}

export default LoginPage;