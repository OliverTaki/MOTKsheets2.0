import React from 'react';
import { Dialog, DialogTitle, DialogContent, Button } from '@mui/material';
import { useContext } from 'react';
import { AuthContext } from '../AuthContext';

export default function ReAuthDialog() {
  const { needsReAuth, interactiveSignIn } = useContext(AuthContext);

  return (
    <Dialog open={needsReAuth} disableEscapeKeyDown>
      <DialogTitle>Session expired</DialogTitle>
      <DialogContent>
        <Button variant="contained" onClick={interactiveSignIn}>
          Sign in with Google
        </Button>
      </DialogContent>
    </Dialog>
  );
}