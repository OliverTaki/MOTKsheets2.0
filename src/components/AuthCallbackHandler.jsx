import React, { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

const AuthCallbackHandler = () => {
  const navigate = useNavigate();
  const { token, setToken, setNeedsReAuth, setError } = useContext(AuthContext);

  useEffect(() => {
    // This component is rendered when Google redirects back with the authorization code
    // The AuthContext's initCodeClient callback should have already processed the code
    // and set the token.
    if (token) {
      navigate('/', { replace: true }); // Redirect to home page if token is present
    } else {
      // If no token, it means there was an error or the callback hasn't fired yet
      // We might need to show an error or retry logic here.
      setError(new Error('Authentication callback failed or token not received.'));
      setNeedsReAuth(true); // Show re-auth dialog
      navigate('/select', { replace: true }); // Redirect to select page to re-initiate login
    }
  }, [token, navigate, setNeedsReAuth, setError]);

  return (
    <div className="p-4 text-center">
      <p>Processing Google authentication...</p>
      <p>Please wait, you will be redirected shortly.</p>
    </div>
  );
};

export default AuthCallbackHandler;
