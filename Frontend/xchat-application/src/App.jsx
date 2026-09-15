import React, { Suspense } from "react"
import { Route, Routes } from "react-router-dom"
import { lazy } from "react"  
import "./index.css"
import Loader from "./components/Loader";
const LoginPage=lazy(()=>import("./Pages/LoginPage"));
const SignupPage=lazy(()=>import("./Pages/Signup"));

function App() {
  return (
    <>
    <Suspense fallback={<Loader/>}>
    <Routes>
      <Route path="/" element={<LoginPage/>}></Route>
      <Route path="/signup" element={<SignupPage/>}></Route>
    </Routes>
  </Suspense>
    </>
  )
}

export default App
