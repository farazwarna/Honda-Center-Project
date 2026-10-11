import React, {  useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
const Protected = ({children}) => {


const navigate=useNavigate()

useEffect(()=>{
    let login=localStorage.getItem('Username')
    if(localStorage.getItem('Username')!="Admin"){
        navigate('/')
    }
})

  return (
    children
  )
}

export default Protected
