// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RoutePlanningPage from './pages/RoutePlanningPage';
import ProtectedRoute from './components/ProtectedRoute';
import ShipmentMap from './pages/ShipmentMap';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/route-planning" 
          element={
            <ProtectedRoute>
              <RoutePlanningPage />
            </ProtectedRoute>
          } 
        />
        <Route
          path="/shipment-tracking/*" 
          element={
            <ProtectedRoute>
              <ShipmentMap />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Login />} /> {/* 默认重定向到登录 */}
      </Routes>
    </AuthProvider>
  );
}

export default App;