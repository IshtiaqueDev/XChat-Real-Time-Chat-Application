import React, { Suspense } from "react"
import { Route, Routes } from "react-router-dom"
import { lazy } from "react"  
import "./index.css"
const LoginPage=lazy(()=>import("./Pages/LoginPage"));

function App() {
  return (
    <>
    <Suspense fallback={<h3>Loading ...........</h3>}>
    <Routes>
      <Route path="/" element={<LoginPage/>}></Route>
    </Routes>
  </Suspense>
    </>
  )
}

export default App
