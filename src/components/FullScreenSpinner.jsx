import React from 'react';
import { CircularProgress } from '@mui/material';

function FullScreenSpinner() {
  return (
    <div className="flex h-screen items-center justify-center">
      <CircularProgress />
    </div>
  );
}

export default FullScreenSpinner;