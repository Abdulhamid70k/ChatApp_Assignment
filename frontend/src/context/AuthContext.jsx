//src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiCall } from '../components/api/apiUtils';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('token');
            const userData = localStorage.getItem('user');

            if (token && userData) {
                const response = await apiCall('/v1/api/auth/verify', 'GET');

                if (response.message === 'Token is valid') {
                    setUser(JSON.parse(userData));
                    setIsLoggedIn(true); // Set isLoggedIn to true when token is valid
                } else {
                    await logout();
                }
            } else {
                console.log('Token or user data missing, logging out...');
                await logout();
            }
        } catch (error) {
            await logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (userData, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData)); 
        setIsLoggedIn(true);
        setUser(userData);
    };

    const logout = async () => {
        console.log('Logging out...');
        localStorage.removeItem('token');
        localStorage.removeItem('user'); 
        setIsLoggedIn(false);
        setUser(null);
        console.log('Logged out successfully');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, isLoggedIn }}> 
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};