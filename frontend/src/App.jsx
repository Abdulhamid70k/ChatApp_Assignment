// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Dashboard/Home.jsx';
import Login from './pages/Auth/Login.jsx';
import Register from './pages/Auth/Register'

const App = () => {
  return (
    <Routes>
     
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Navigate to="/dashboard/home" replace />
          </ProtectedRoute>
        } 
      />

      
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

     
      <Route
        path="/dashboard/home"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default App;