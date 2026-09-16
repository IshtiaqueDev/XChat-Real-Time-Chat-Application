import React, { useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";

function Signup(){
    
    const initialState={
        username:"",
        email:"",
        password:"",
    }

    const[formData,setFormData]=useState(initialState);
    
    const handleChange=(e)=>{
       setFormData((prevData)=>{
        return {
            ...prevData,[e.target.name]:e.target.value
        }
       })
    }

    const handleSubmit=async(e)=>{
        e.preventDefault();
        if(formData.password.length<8){
            toast.warn("Password Should be at least 8 characters")
            return;
        }

        try{
            let response=await axios.post("http://localhost:5000/user/signup",formData,{
            withCredentials:true
        })
        toast.success(response.data.message);
        }catch(err){
            toast.error(err.message);
        }
        console.log(formData)
        setFormData(initialState);
    }



    return(
        <>
     <div className="container-fluid vh-100 d-flex justify-content-center align-items-center bg-light">
    <div className="row shadow rounded overflow-hidden" style={{ maxWidth: '900px', width: '100%' }}>
        <div className="col-md-6 bg-success text-white text-center d-flex flex-column justify-content-center align-items-center p-5">
            <h5 className="display-6"><span className="fw-bold">X</span>Chat</h5>
            <p className="mb-0">A Chat Application where you make new friends</p>
        </div>

        <div className="col-md-6 bg-white p-5">
            <div className="card border-0">
                <h3 className="mb-4 text-center">Signup Page</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="username" className="form-label">Username:</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            required
                            onChange={handleChange}
                            value={formData.username}
                            className="form-control"
                            placeholder="exp: Hooria"
                        />
                    </div>

                     <div className="mb-3">
                        <label htmlFor="email" className="form-label">Email:</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            onChange={handleChange}
                            value={formData.email}
                            className="form-control"
                            placeholder="exp: hooria@hotmail.com"
                        />
                    </div>

                    

                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">Password:</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="form-control"
                            required
                            placeholder="exp: 1234"
                        />
                    </div>

                    <button type="submit" className="btn btn-success w-100">
                        Signup
                    </button>
                </form>

                <p className="text-center mt-3 mb-0">
                    Already Logged In? <a href="/">Login Here</a>
                </p>
            </div>
        </div>
    </div>
</div>
        </>
    )
}

export default Signup;