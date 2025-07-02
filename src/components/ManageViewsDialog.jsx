import React from 'react';
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
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import usePagesData from '../hooks/usePagesData';

const ManageViewsDialog = ({ open, onClose, onDelete }) => {
  const { pages } = usePagesData();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Manage Views</DialogTitle>
      <DialogContent>
        <List>
          {pages.map((page) => (
            <ListItem
              key={page.page_id}
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
      </DialogActions>
    </Dialog>
  );
};

export default ManageViewsDialog;
