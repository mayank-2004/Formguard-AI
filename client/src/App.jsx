import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from "./components/layout/AppLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Forms from "./pages/Forms.jsx";
import Submissions from "./pages/Submissions.jsx";
import FormBuilder from './pages/FormBuilder.jsx';
import PublicForm from "./pages/PublicForm.jsx";
import './App.css'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/respond/:id"
          element={<PublicForm />}
        />
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
            path="*"
            element={<Navigate to="/dashboard" replace />}
          />

        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
