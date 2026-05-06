import { createBrowserRouter, Navigate } from 'react-router';
import POSScreen from './pages/pos/POSScreen';
import POSLogin from './pages/pos/POSLogin';

export const router = createBrowserRouter([
  { path: '/', element: <POSScreen /> },
  { path: '/login', element: <POSLogin /> },
  { path: '*', element: <Navigate to="/" replace /> },
]);
