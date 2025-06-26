import React, { useContext } from 'react';
import { AuthContext } from '../AuthContext';

const LoginButton = () => {
    // useAuth() の代わりに useContext(AuthContext) を使用する
    const { token, signIn, signOut, isInitialized, error } = useContext(AuthContext);

    if (!isInitialized) {
        return (
            <button className="bg-gray-500 text-white font-bold py-2 px-4 rounded" disabled>
                Initializing Auth...
            </button>
        );
    }

    if (error) {
        return (
            <div>
                <p className="text-red-500">Authentication Error: {error.message || 'An unknown error occurred.'}</p>
                <button 
                    onClick={signIn} 
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    Retry Sign In
                </button>
            </div>
        );
    }

    return (
        <div>
            {token ? (
                <button 
                    onClick={signOut} 
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                >
                    Sign Out
                </button>
            ) : (
                <button 
                    onClick={signIn} 
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    Sign In with Google
                </button>
            )}
        </div>
    );
};

export default LoginButton;
