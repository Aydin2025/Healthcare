import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import App from './App.jsx'
import './styles/global.css'
import './styles/components.css'
import './styles/pages.css'
import './styles/auth.css'
import './styles/booking.css'
import './styles/appointments.css'
import './styles/plans.css'
import './styles/calendar.css'
import './styles/payments.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
