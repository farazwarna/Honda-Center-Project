import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
export default function UpdateAvailableProducts({
  isOpen,
  onClose,
  load,
  productid,
  productname,
  purchasedprice,
  sellingprice,
  wholesaleprice
}) {

  const [productretailprice, setProductRetailPrice] = useState(sellingprice)
  const [productwholesaleprice, setProductWholeSalePrice] = useState(wholesaleprice)

  const navigate = useNavigate()

const handleSubmit = async (e) => {
  e.preventDefault()
  // convert to numbers (IMPORTANT)
  const retail = Number(productretailprice)
  const wholesale = Number(productwholesaleprice)
  const purchaseprice=Number(purchasedprice)

  if (wholesale > retail ) {
    toast.error("Wholesale price must be less than or equal to retail price ❌")
    return
  }
  else if(wholesale<=purchaseprice && retail<=purchaseprice){
      toast.error("Prices cannot  be less than or equal to Purchased  Price ❌")
    return
  }
  
  try {
   await toast.promise(
  axios.put('http://localhost:8081/AvailableProducts/UpdateAvailableStocks', {
    productretailprice,
    productwholesaleprice,
    product_id: productid
  }),
  {
    pending: 'Updating product...',
    success: 'Product updated successfully ✅',
    error: 'Update failed ❌'
  }
)

  

  await load()
    onClose()
    navigate('/Admin/AvailableProducts')

  } catch (err) {
    console.log(err)
  
  }
}

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Update Stock</h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          <label>Product Name</label>
          <input
            value={productname}
            readOnly
            className="w-full border rounded-lg px-3 py-2"
          />
              <label>Purchased Price</label>
          <input
            value={purchasedprice}
            readOnly
            className="w-full border rounded-lg px-3 py-2"
          />

          <label>Retail Price</label>
          <input
            type="number"
            value={productretailprice}
            onChange={(e) => setProductRetailPrice(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            required
          />

          <label>Wholesale Price</label>
          <input
            type="number"
            value={productwholesaleprice}
            onChange={(e) => setProductWholeSalePrice(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-lg">
              Cancel
            </button>

            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
              Submit
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}