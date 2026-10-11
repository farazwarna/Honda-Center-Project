import express from 'express'
import cors from 'cors'
import db from './config/db.js'
import LoansRoutes from './routes/Loans.js'
import authRoutes from  './routes/auth.js'
import UserRoutes from './routes/UserRoutes.js'
import ProductCrudRoutes from './routes/ProductCrudRoutes.js'
import AvailableProducts from './routes/AvailableProducts.js'
import SaleRoutes from './routes/Sales.js'
import PurchaseRoutes from './routes/PurchasefromSupplier.js'

import SupplierRoutes from './routes/SupplierOrder.js'
import expenseRoutes from './routes/Expenses.js'
import admindashboardroutes from './routes/AdminDashboard.js'
import returnproductroutes from './routes/Return.js'
import cashloans from './routes/CashLoan.js'
import ReportsRoutes from './routes/Reports.js'
import adminUpdateRoute from './routes/admin.js'

const app=express()
app.use(cors())
app.use(express.json())

app.use(express.urlencoded({ extended: true }));


app.use('/auth',authRoutes)
app.use('/User',UserRoutes)
app.use('/Sales',SaleRoutes)
app.use('/Products',ProductCrudRoutes)
app.use('/AvailableProducts',AvailableProducts)
app.use('/Loans',LoansRoutes)
app.use('/Supplier',SupplierRoutes)
app.use('/Purchase',PurchaseRoutes)
app.use('/Admin',admindashboardroutes)
app.use('/Return',returnproductroutes)
app.use('/Expenses',expenseRoutes)
app.use('/Reports',ReportsRoutes)
app.use('/CashLoan',cashloans)
app.use('/Admin',adminUpdateRoute)
app.post('/addNewPurchase',(req,res)=>{
          const sql="call Purchase(?);"
    const values=[
        req.body.productid,
        req.body.quantity,

    ]    
    db.query(sql,[values],(err,data)=>{
        if(err) return console.log(err)
          
     
        return res.json("data Create SuccesFully")
    })

})









const PORT = process.env.PORT || 8081;
app.listen(PORT,()=>{
    console.log("Server is Running")
})
