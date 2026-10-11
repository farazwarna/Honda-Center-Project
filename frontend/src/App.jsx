


// import { BrowserRouter,Routes,Route,Link } from 'react-router-dom'
// import Login from './pages/auth/Login'


// import Home from './pages/admin/Home'
// import Protected from './components/admin/Protected'
// import MainLayout from './layout/MainLayout'
// import UpdateProduct from './pages/admin/products/UpdateProduct'
// import AddProducts from './pages/admin/products/AddProducts'
// import PurchaseProducts from './pages/admin/products/PurchaseProducts'
// import AvailableProducts from './pages/admin/products/AvailableProducts'
// import MainLayoutUser from './layout/MainLayoutUser'
// import ProtectedUser from './components/user/ProtectedUser'
// import UserHome from './pages/user/UserHome'
// import SellProducts from './pages/user/SellProducts'
// import Sales from './pages/user/Sales'
// import { ToastContainer } from 'react-toastify'
// import Loans from './pages/user/Loans'
// import SupplierOrders from './pages/admin/OrderSupplier/SupplierOrder'

// import SupplierPayment from './pages/admin/OrderSupplier/SupplierPayments'
// import SupplierCredit from './pages/admin/OrderSupplier/SupplierCredit'
// import AdminDashboard from './pages/admin/Dashboard/AdminDashboard'
// import ReturnProducts from './pages/user/ReturnProducts'
// import Expenses from './pages/user/Expense'
// import Reports from './pages/user/Reports'
// import EasyKhata from './pages/user/Khata'
// import UpdatePassword from './pages/admin/UpdateAdmin'

// function App() {
  

//   return (
//     <>
//     <ToastContainer position="top-right" autoClose={2000} />
//    <BrowserRouter>
     
//         <Routes>
//         <Route path="/" element={<Login/>} />
//         <Route path='/' element={<MainLayout />}>
//        /// //////////////   Admin Pages
//        <Route path='/Admin' element={
//         <Protected>
//           <Home/>
          
          
//         </Protected>

//        }></Route>
//            <Route path='/Admin/AddProduct' element={
//         <Protected>
//           <AddProducts/>
//         </Protected>
//        }/>
       
//            <Route
//           path='/Admin/UpdateProduct/:id' element={
//             <Protected>
//               <UpdateProduct/>
//             </Protected>
//           }/>

//               <Route
//           path='/Admin/Purchase' element={
//             <Protected>
//               <PurchaseProducts/>
//             </Protected>
//           }/>
//                   <Route
//           path='/Admin/AvailableProducts' element={
//             <Protected>
//               <AvailableProducts/>
//             </Protected>
//           }/>
       
//        <Route path='/Admin/Orders' element={
//               <SupplierOrders/>
//             }/>
     
//              <Route path='/Admin/SupplierPayments' element={
//               <SupplierPayment/>
//             }/>
//               <Route path='/Admin/SupplierCredit' element={
//               <SupplierCredit/>
//             }/>
//               <Route path='/Admin/Dashboard' element={
//               <AdminDashboard/>
//             }/>
//               <Route path='/Admin/UpdateAdmin' element={
//               <UpdatePassword/>
//             }/>
       
       
       
//        </Route>

//       <Route path='/' element={<MainLayoutUser/>}>



// <Route path='/User' element={  
//               <UserHome/>
//             }  />
//             <Route path='/User/Sell' element={  
//               <SellProducts />
//             }  />
//             <Route path='/User/Sales' element={
//               <Sales/>
//             }/>


//             <Route path='/User/Loans' element={
//               <Loans/>
//             }/>
             
             
//             <Route path='/User/ReturnProduct' element={
//               <ReturnProducts/>
//             }/>
//              <Route path='/User/Expenses' element={
//               <Expenses/>
//             }/>
//             <Route path='/User/Reports' element={
//               <Reports/>
//             }/>
//               <Route path='/User/EasyKhata' element={
//               <EasyKhata/>
//             }/>




//       </Route>
       
//       </Routes>
//     </BrowserRouter>
//     </>
//   )
// }

// export default App












import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Login from './pages/auth/Login'
import Home from './pages/admin/Home'
import Protected from './components/admin/Protected'
import MainLayout from './layout/MainLayout'
import UpdateProduct from './pages/admin/products/UpdateProduct'
import AddProducts from './pages/admin/products/AddProducts'
import PurchaseProducts from './pages/admin/products/PurchaseProducts'
import AvailableProducts from './pages/admin/products/AvailableProducts'
import MainLayoutUser from './layout/MainLayoutUser'
import ProtectedUser from './components/user/ProtectedUser'
import UserHome from './pages/user/UserHome'
import SellProducts from './pages/user/SellProducts'
import Sales from './pages/user/Sales'
import { ToastContainer } from 'react-toastify'
import Loans from './pages/user/Loans'
import SupplierOrders from './pages/admin/OrderSupplier/SupplierOrder'
import SupplierPayment from './pages/admin/OrderSupplier/SupplierPayments'
import SupplierCredit from './pages/admin/OrderSupplier/SupplierCredit'
import AdminDashboard from './pages/admin/Dashboard/AdminDashboard'
import ReturnProducts from './pages/user/ReturnProducts'
import Expenses from './pages/user/Expense'
import Reports from './pages/user/Reports'
import EasyKhata from './pages/user/Khata'
import UpdatePassword from './pages/admin/UpdateAdmin'

// Simple error screen when app is expired
function AppExpired() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0f172a',
      color: '#fff',
      fontFamily: 'sans-serif',
      textAlign: 'center',
      padding: '20px'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: '#ef4444' }}>
        403 — Access Denied
      </h1>
      <p style={{ fontSize: '1.2rem', color: '#94a3b8', maxWidth: '500px' }}>
        This application is no longer available. The license expired on <strong>May 30, 2026</strong>.
      </p>
      <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#64748b' }}>
        Contact support to renew your access.
      </p>
    </div>
  )
}

function App() {
  // Check if current date is May 30, 2026 or later
  const now = new Date()
  const expiryDate = new Date(2026, 12, 20) // Month is 0-indexed: 4 = May
  const isExpired = now >= expiryDate

  // If expired, only show the error screen (no routes at all)
  if (isExpired) {
    return <AppExpired />
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={2000} />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />

          <Route path='/' element={<MainLayout />}>
            {/* Admin Pages */}
            <Route path='/Admin' element={
              <Protected><Home /></Protected>
            } />
            <Route path='/Admin/AddProduct' element={
              <Protected><AddProducts /></Protected>
            } />
            <Route path='/Admin/UpdateProduct/:id' element={
              <Protected><UpdateProduct /></Protected>
            } />
            <Route path='/Admin/Purchase' element={
              <Protected><PurchaseProducts /></Protected>
            } />
            <Route path='/Admin/AvailableProducts' element={
              <Protected><AvailableProducts /></Protected>
            } />
            <Route path='/Admin/Orders' element={<SupplierOrders />} />
            <Route path='/Admin/SupplierPayments' element={<SupplierPayment />} />
            <Route path='/Admin/SupplierCredit' element={<SupplierCredit />} />
            <Route path='/Admin/Dashboard' element={<AdminDashboard />} />
            <Route path='/Admin/UpdateAdmin' element={<UpdatePassword />} />
          </Route>

          <Route path='/' element={<MainLayoutUser />}>
            <Route path='/User' element={<UserHome />} />
            <Route path='/User/Sell' element={<SellProducts />} />
            <Route path='/User/Sales' element={<Sales />} />
            <Route path='/User/Loans' element={<Loans />} />
            <Route path='/User/ReturnProduct' element={<ReturnProducts />} />
            <Route path='/User/Expenses' element={<Expenses />} />
            <Route path='/User/Reports' element={<Reports />} />
            <Route path='/User/EasyKhata' element={<EasyKhata />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App