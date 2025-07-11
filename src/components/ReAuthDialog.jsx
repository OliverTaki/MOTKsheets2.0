import React from 'react';
import { Dialog, DialogTitle, DialogContent, Button, Typography } from '@mui/material';
import { useContext } from 'react';
import { AuthContext } from '../AuthContext';

const ReAuthDialog = () => {
  const { needsReAuth, interactiveSignIn, authError } = useContext(AuthContext);

  return (
    <Dialog open={needsReAuth}>
      <DialogTitle>Google への再認証が必要です</DialogTitle>
      <DialogContent sx={{ textAlign: 'center', pb: 4 }}>
        <Typography sx={{ mb: 3 }}>
          {authError?.toString() ?? ''}
          <br/>ブラウザのポップアップブロックにより自動更新に失敗しました。<br/>
          下のボタンを押して再ログインしてください。
        </Typography>
        <Button variant="contained" onClick={interactiveSignIn}>
          Google でログイン
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ReAuthDialog;