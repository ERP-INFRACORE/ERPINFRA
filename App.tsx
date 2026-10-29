import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/ToastContainer';
import Layout from './components/Layout';
import Placeholder from './components/Placeholder';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import Purchases from './pages/Purchases';
import Clients from './pages/Clients';
import Production from './pages/Production';
import Finance from './pages/Finance';
import HR from './pages/HR';
import Reports from './pages/Reports';
import Fleet from './pages/Fleet';
import Settings from './pages/Settings';

import { useApp } from './context/AppContext';
import { getInitialRouteForUser } from './permission_constants';
import Login from './pages/Login';

const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const { currentUser } = useApp();
  if (!currentUser) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }
  return children;
};

const RootIndexRoute = () => {
  const { currentUser, roles } = useApp();
  const landingRoute = getInitialRouteForUser(currentUser, roles);
  if (landingRoute !== '/') {
    return <Navigate to={landingRoute} replace />;
  }
  return <Dashboard />;
};

const App = () => {
  return (
    <AppProvider>
      <ToastProvider>
        <HashRouter>
          <ToastContainer />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<RootIndexRoute />} />
              <Route path="sales" element={<Sales />} />
              <Route path="purchases" element={<Purchases />} />
              <Route path="clients" element={<Clients />} />
              <Route path="production" element={<Production />} />
              <Route path="finance" element={<Finance />} />
              <Route path="hr" element={<HR />} />
              <Route path="reports" element={<Reports />} />
              <Route path="fleet" element={<Fleet />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </HashRouter>
      </ToastProvider>
    </AppProvider>
  );
};

export default App;