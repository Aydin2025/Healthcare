import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Services from './pages/Services'
import Team from './pages/Team'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Book from './pages/Book'
import PatientDashboard from './pages/PatientDashboard'
import StaffDashboard from './pages/StaffDashboard'
import StaffPatients from './pages/StaffPatients'
import PatientPlanEditor from './pages/PatientPlanEditor'
import ExerciseLibrary from './pages/ExerciseLibrary'

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/team" element={<Team />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/book" element={<Book />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <ProtectedRoute allowedRoles={['practitioner', 'admin']}>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/patients"
            element={
              <ProtectedRoute allowedRoles={['practitioner', 'admin']}>
                <StaffPatients />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/patients/:patientId"
            element={
              <ProtectedRoute allowedRoles={['practitioner', 'admin']}>
                <PatientPlanEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/exercises"
            element={
              <ProtectedRoute allowedRoles={['practitioner', 'admin']}>
                <ExerciseLibrary />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <Footer />
    </>
  )
}
