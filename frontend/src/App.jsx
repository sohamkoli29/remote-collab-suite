
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Workspace from './pages/Workspace';
import Layout from './components/Layout';

// Create a router with future flags to suppress warnings
const createRouter = () => (
  <Router future={{
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }}>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/workspace/:workspaceId" element={
        <ProtectedRoute>
          <Layout>
            <Workspace />
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  </Router>
);

function App() {
  return (
    <AuthProvider>
      {createRouter()}
    </AuthProvider>
  );
}

export default App;