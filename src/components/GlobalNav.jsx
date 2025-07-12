import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDriveSheets } from '../hooks/useDriveSheets';
import { toProjectName } from '../utils/id';
import { AppBar, Toolbar, Typography, Button, Box, Menu, MenuItem } from '@mui/material';
import LoginButton from './LoginButton'; // Assuming LoginButton is in the same directory
import { AuthContext } from '../AuthContext';
import { SheetsContext } from '../contexts/SheetsContext';

export default function GlobalNav() {
  const navigate = useNavigate();
  const { sheetId, setSheetId } = useContext(SheetsContext);

  // Drive 上の MOTK プロジェクト一覧を取得
  const { sheets, loading, error } = useDriveSheets();

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const { needsReAuth, signIn, token } = useContext(AuthContext);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProjectSelect = (id) => {
    setSheetId(id);
    handleMenuClose();
    navigate('/');
  };

  useEffect(() => {
    if (sheetId && sheets.length > 0) {
      const currentSheet = sheets.find(sheet => sheet.id === sheetId);
      if (!currentSheet) {
        setSheetId(null);
      }
    }
  }, [sheetId, sheets, setSheetId]);

  return (
    <AppBar position="static" sx={{ bgcolor: '#202020', height: '48px', justifyContent: 'left' }}>
      <Toolbar variant="dense" sx={{ minHeight: '48px' }}>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          MOTK
        </Typography>

        {token && (
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'left' }}>
            <Typography variant="subtitle1" component="div" sx={{ mr: 2 }}>
              Project: {sheetId ? toProjectName(sheets.find(s => s.id === sheetId) || {}) : 'None Selected'}
            </Typography>
            <Button
              id="project-dropdown-button"
              aria-controls={open ? 'project-dropdown-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
              onClick={handleMenuClick}
              color="inherit"
              className="px-2 py-1 bg-zinc-700 rounded normal-case"
            >
              Change Project
            </Button>
            <Menu
              id="project-dropdown-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={handleMenuClose}
              MenuListProps={{
                'aria-labelledby': 'project-dropdown-button',
              }}
            >
              {loading && <MenuItem disabled>Loading projects...</MenuItem>}
              {error && <MenuItem disabled>Error: {error.message}</MenuItem>}
              {sheets.length === 0 && !loading && (
                <MenuItem disabled>No Google Sheets found</MenuItem>
              )}
              {sheets
                .sort((a, b) => toProjectName(a).localeCompare(toProjectName(b)))
                .map((file) => (
                  <MenuItem key={file.id} onClick={() => handleProjectSelect(file.id)}>
                    {toProjectName(file)}
                  </MenuItem>
                ))}
            </Menu>
          </Box>
        )}

        {needsReAuth ? (
          <Button color="inherit" onClick={signIn}>Re-authenticate</Button>
        ) : (
          <LoginButton />
        )}
      </Toolbar>
    </AppBar>
  );
}