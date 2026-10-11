import React, {  useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
const ProtectedUser = ({children}) => {


const navigate=useNavigate()

useEffect(()=>{
    let login=localStorage.getItem('Username1')
    if(!login){
        navigate('/')
    }
},[])

  return (
    children
  )
}

export default ProtectedUser
