import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDriveSheets } from '../hooks/useDriveSheets';
import { SheetsDataContext } from '../contexts/SheetsDataContext';
import { toProjectName } from '../utils/id';
import { AppBar, Toolbar, Typography, Button, Box, Menu, MenuItem } from '@mui/material';
import LoginButton from './LoginButton'; // Assuming LoginButton is in the same directory
import { AuthContext } from '../AuthContext';

export default function GlobalNav() {
  const navigate = useNavigate();
  const { sheetId, setSheetId } = useContext(SheetsDataContext);

  // Drive 上の MOTK プロジェクト一覧を取得
  const { sheets, loading, error } = useDriveSheets();
  const [currentProjectDisplayName, setCurrentProjectDisplayName] = useState('Select Project');
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const { needsReAuth, signIn } = useContext(AuthContext);

  // sheets, sheetId などが必要な場合は useContext(SheetsDataContext) で取得してください
  // 例:
  // const { sheets } = useContext(SheetsDataContext);

  useEffect(() => {
    if (sheetId && sheets.length > 0) {
      const currentSheet = sheets.find(sheet => sheet.id === sheetId);
      if (currentSheet) {
        setCurrentProjectDisplayName(toProjectName(currentSheet));
      } else {
        setCurrentProjectDisplayName('Select Project');
      }
    } else {
      setCurrentProjectDisplayName('Select Project');
    }
  }, [sheetId, sheets]);

  const changeProject = (id) => {
    setSheetId(id);
    localStorage.setItem('motk:lastSheetId', id);
    navigate('/');
    setAnchorEl(null); // Close dropdown after selection
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="static" className="bg-zinc-800 text-white shadow-none">
      <Toolbar className="flex items-center h-12 px-4">
        {/* LOGO -> /select */}
        <Button color="inherit" onClick={() => {
          setSheetId(null);
          localStorage.removeItem('motk:lastSheetId');
          navigate('/select');
        }} className="font-bold mr-8 normal-case text-lg">
          MOTK
        </Button>

        {/* Project Dropdown */}
        <Box>
          <Button
            id="project-dropdown-button"
            aria-controls={open ? 'project-dropdown-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
            onClick={() => navigate('/select')}
            color="inherit"
            className="px-2 py-1 bg-zinc-700 rounded normal-case"
          >
            {currentProjectDisplayName}
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
            {error && <MenuItem disabled className="text-red-400">Error loading projects</MenuItem>}
            {!loading && !error && sheets.length === 0 && (
              <MenuItem disabled>
                No projects found
              </MenuItem>
            )}
            {!loading && !error && sheets.length > 0 && (
              sheets
                .sort((a, b) => toProjectName(a).localeCompare(toProjectName(b)))
                .map((f) => (
                  <MenuItem key={f.id} onClick={() => changeProject(f.id)}>
                    {toProjectName(f)}
                  </MenuItem>
                ))
            )}
          </Menu>
        </Box>

        {/* Sign-out 等は右端 */}
        <Box sx={{ ml: 'auto' }}>
          <>
            <Button onClick={signIn} variant="contained" color="warning" sx={{ mr: 1 }}>
              Re-login
            </Button>
            <button style={{position:'fixed',top:10,right:10,zIndex:9999}}
                    onClick={()=>window.__MOTK_DEBUG?.requestAccess?.()}> 
               Sign-In (debug)
            </button>
          </>
          <LoginButton />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
