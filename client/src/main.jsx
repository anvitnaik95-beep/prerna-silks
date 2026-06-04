import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { OrderListProvider } from './components/OrderList'
import OrderListPanel from './components/OrderList'
import WhatsAppButton from './components/WhatsAppButton'
import ErrorBoundary from './components/ErrorBoundary'
import App from './App'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'

try { localStorage.removeItem('theme'); } catch (e) {}
try { document.body.classList.remove('dark-theme'); } catch (e) {}
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <OrderListProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
          <OrderListPanel />
          <WhatsAppButton />
        </OrderListProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
