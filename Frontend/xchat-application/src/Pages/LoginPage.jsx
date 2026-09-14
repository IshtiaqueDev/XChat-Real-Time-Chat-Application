import React, { useState } from "react";

function LoginPage(){
    const initialState={
        username:"",
        password:""
    }
    const[formData,setFormData]=useState(initialState);
    const handleSubmit=(e)=>{
        e.preventDefault();
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
                <h3 className="mb-4 text-center">Login Page</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="username" className="form-label">Username:</label>
                        <input
                            type="text"
                            id="username"
                            className="form-control"
                            placeholder="exp: Hooria"
                        />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">Password:</label>
                        <input
                            type="password"
                            id="password"
                            className="form-control"
                            placeholder="exp: 1234"
                        />
                    </div>

                    <button type="submit" className="btn btn-success w-100">
                        Login
                    </button>
                </form>

                <p className="text-center mt-3 mb-0">
                    Not Logged In? <a href="/signup">Signup</a>
                </p>
            </div>
        </div>
    </div>
</div>
        </>
    )
}

export default LoginPage;