import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Box,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import usePagesData from '../hooks/usePagesData';

const ManageViewsDialog = ({
  open,
  onClose,
  onSave,
  onSaveAs,
  onDelete,
  loadedPageId,
}) => {
  const { pages } = usePagesData();
  const [newPageName, setNewPageName] = useState('');

  const handleSaveAs = () => {
    if (!newPageName.trim()) {
      alert('Please enter a name for the new view.');
      return;
    }
    onSaveAs(newPageName);
    setNewPageName('');
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Manage Views</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="New View Name"
            variant="outlined"
            size="small"
            value={newPageName}
            onChange={(e) => setNewPageName(e.target.value)}
            fullWidth
          />
          <Button onClick={handleSaveAs} variant="contained">
            Save As
          </Button>
        </Box>
        <List>
          {pages.map((page) => (
            <ListItem
              key={page.page_id}
              selected={page.page_id === loadedPageId}
              secondaryAction={
                <IconButton edge="end" aria-label="delete" onClick={() => onDelete(page.page_id)}>
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText primary={page.title} />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button onClick={onSave} disabled={!loadedPageId} variant="contained">
          Save Current View
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ManageViewsDialog;
