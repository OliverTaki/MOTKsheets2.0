import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDriveSheets } from '../hooks/useDriveSheets';
import { toProjectName } from '../utils/id';
import { AppBar, Toolbar, Typography, Button, Box, Menu, MenuItem } from '@mui/material';
import LoginButton from './LoginButton'; // Assuming LoginButton is in the same directory

export default function GlobalNav({ sheetId, setSheetId }) {
  const navigate = useNavigate();
  const { sheets, loading, error } = useDriveSheets();
  const [currentProjectDisplayName, setCurrentProjectDisplayName] = useState('Select Project');
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

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
            onClick={handleMenuClick}
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
          <LoginButton />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
