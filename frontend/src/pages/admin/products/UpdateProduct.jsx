import React, { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'
import { useParams } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
const UpdateProduct = () => {


const [productkey,setProductKey]=useState('')
const [productname,setProductName]=useState('')
const [productprice,setProductPrice]=useState('')
const [productdesc1,setProductDesc]=useState('')
const navigate=useNavigate()
const [data,setdata]=useState([])
const {id}=useParams()
///////////////
  const [product, setProduct] = useState([]);

  // Fetch single row
  useEffect(() => {
    if (!id) return;

    axios
      .get(`http://localhost:8081/Products/productEdit/${id}`)
      .then((res) => {
        setProduct(res.data);
        setProductKey(res.data.Product_Key)
        setProductName(res.data.Product_Name)
        setProductPrice(res.data.Product_Price)
      })
      .catch((err) => console.log(err));
  }, [id]);




////////////
const handleSubmit= (e)=>{
    e.preventDefault()
    axios.put('http://localhost:8081/Products/updateProduct/'+id,{productkey,productname,productprice,productdesc1})
    .then(res=>{navigate('/Admin')}).catch(err=>console.log(err))
}

  return (
    <div className="flex justify-center items-center min-h-screen bg-base-200 m-2">
  

  <div className="card w-full max-w-2xl bg-base-100 shadow-xl p-6">
    
    <h2 className="text-2xl font-bold mb-4">Update Product</h2>

     <form onSubmit={handleSubmit}>
    <div className="card bg-base-200 p-6 rounded-lg">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      

     
        <div>
          <label className="label">
            
            <span className="label-text font-semibold">Product Key</span>
          </label>
          <input type="text" value={productkey}   onChange={e=>setProductKey(e.target.value)} required placeholder="Enter product key" className="input input-bordered w-full" />
        </div>

        
        <div>
          <label className="label">
            <span className="label-text font-semibold">Product Name</span>
          </label>
          <input type="text" value={productname} placeholder="Enter product name" required  onChange={e=>setProductName(e.target.value)} className="input input-bordered w-full" />
        </div>

        
        <div>
          <label className="label">
            <span className="label-text font-semibold">Product Price</span>
          </label>
          <input type="number" value={productprice} placeholder="Enter price" required onChange={e=>setProductPrice(e.target.value)} className="input input-bordered w-full" />
        </div>

     
        <div className="md:col-span-2">
          <label className="label">
            <span className="label-text font-semibold">Product Description</span>
          </label>
          <textarea  value={productdesc1} className="textarea textarea-bordered w-full" required  onChange={e=>setProductDesc(e.target.value)} placeholder="Enter description"></textarea>
        </div>

      </div>

     
      <div className="mt-6 text-right">
        <button className="btn btn-success" type='submit' >
          Update Product
        </button>
      </div>

    </div>
    </form>

  </div>

</div>
  )
}

export default UpdateProduct
