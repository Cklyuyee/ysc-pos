import { createBrowserRouter, Navigate } from 'react-router';
import POSScreen from './pages/pos/POSScreen';
import POSLogin from './pages/pos/POSLogin';
import CustomerDisplayScreen from './pages/pos/CustomerDisplayScreen';

export const router = createBrowserRouter([
  { path: '/', element: <POSScreen /> },
  { path: '/login', element: <POSLogin /> },
  { path: '/display', element: <CustomerDisplayScreen /> },
  { path: '*', element: <Navigate to="/" replace /> },
]);
