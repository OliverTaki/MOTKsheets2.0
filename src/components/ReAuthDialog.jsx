import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

const ReAuthDialog = ({ open, onConfirm }) => {
  return (
    <Dialog open={open} disableEscapeKeyDown>
      <DialogTitle>Session Expired</DialogTitle>
      <DialogContent>
        <Typography>Your session has expired. Please sign in to Google again to continue.</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onConfirm} color="primary" variant="contained">
          Sign in to Google
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReAuthDialog;