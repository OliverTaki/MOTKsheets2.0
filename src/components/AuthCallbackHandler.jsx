import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FullScreenSpinner from './FullScreenSpinner';

const AuthCallbackHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // The Google Identity Services library handles the token exchange automatically
    // when ux_mode: 'redirect' is used.
    // We just need to navigate back to the home page after the redirect.
    // A small delay might be needed to ensure GIS has processed the response.
    const timer = setTimeout(() => {
      navigate('/');
    }, 1000); // Adjust delay if needed

    return () => clearTimeout(timer);
  }, [navigate]);

  return <FullScreenSpinner message="Authenticating..." />;
};

export default AuthCallbackHandler;