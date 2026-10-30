import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './features/auth/AuthContext.jsx';
import ProtectedRoute from './features/auth/ProtectedRoute.jsx';
import AppLayout from "./components/layout/AppLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Forms from "./pages/Forms.jsx";
import Submissions from "./pages/Submissions.jsx";
import FormBuilder from './pages/FormBuilder.jsx';
import PublicForm from "./pages/PublicForm.jsx";
import SubmissionDetails from './pages/SubmissionDetails.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import './App.css'

function App() {

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public authentication pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Public form respondents don't need an account */}
          <Route
            path="/respond/:id"
            element={<PublicForm />}
          />

          {/* Everything below requires authentication */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route
                path="/"
                element={<Navigate to="/dashboard" replace />}
              />

              <Route
                path="/dashboard"
                element={<Dashboard />}
              />

              <Route
                path="/forms"
                element={<Forms />}
              />

              <Route
                path="/forms/new"
                element={<FormBuilder />}
              />

              <Route
                path="/forms/:id/edit"
                element={<FormBuilder />}
              />

              <Route
                path="/submissions"
                element={<Submissions />}
              />

              <Route
                path="/submissions/:id"
                element={<SubmissionDetails />}
              />

              <Route
                path="*"
                element={<Navigate to="/dashboard" replace />}
              />

            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
