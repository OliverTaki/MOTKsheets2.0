import React, { useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { Button, CircularProgress, Typography, Box } from '@mui/material';

const LoginButton = () => {
    const { token, signIn, signOut, isInitialized } = useContext(AuthContext);

    return (
        <Box>
            {token ? (
                <Button onClick={signOut} variant="contained" color="error">
                    Sign Out
                </Button>
            ) : (
                <Button onClick={signIn} variant="contained" color="primary" disabled={!isInitialized}>
                    Sign In with Google
                </Button>
            )}
        </Box>
    );
};

export default LoginButton;