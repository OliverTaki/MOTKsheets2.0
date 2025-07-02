import React, { useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { Button, CircularProgress, Typography, Box } from '@mui/material';

const LoginButton = () => {
    const { token, signIn, signOut, isInitialized, error } = useContext(AuthContext);

    if (!isInitialized) {
        return (
            <Button variant="contained" disabled startIcon={<CircularProgress size={20} color="inherit" />}>
                Initializing Auth...
            </Button>
        );
    }

    if (error) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography color="error" variant="body2">Auth Error: {error.message || 'Unknown error.'}</Typography>
                <Button onClick={signIn} variant="contained" color="primary">
                    Retry Sign In
                </Button>
            </Box>
        );
    }

    return (
        <Box>
            {token ? (
                <Button onClick={signOut} variant="contained" color="error">
                    Sign Out
                </Button>
            ) : (
                <Button onClick={signIn} variant="contained" color="primary">
                    Sign In with Google
                </Button>
            )}
        </Box>
    );
};

export default LoginButton;