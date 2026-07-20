"use client";
import React, { useState } from 'react';
import { Switch, FormControlLabel } from '@mui/material';
import ConfirmDialog from './ConfirmDialog';

const AdminApprovedToggle = ({ value, onChange, disabled, size = 'medium', showLabel = true, labelSx }) => {
  const [open, setOpen] = useState(false);
  const [pendingValue, setPendingValue] = useState(value);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSwitchChange = (event) => {
    setPendingValue(event.target.checked);
    setOpen(true);
  };

  const handleConfirm = async () => {
    if (pendingValue !== value) {
      setIsUpdating(true);
      try {
        await onChange(pendingValue);
      } finally {
        setIsUpdating(false);
        setOpen(false);
      }
    } else {
      setOpen(false);
    }
  };

  const handleCancel = () => {
    if (!isUpdating) {
      setOpen(false);
      setPendingValue(value);
    }
  };

  const switchComponent = (
    <Switch
      checked={!!value}
      onChange={handleSwitchChange}
      color="primary"
      disabled={disabled}
      size={size}
    />
  );

  return (
    <>
      {showLabel ? (
        <FormControlLabel
          control={switchComponent}
          label={
            <span style={{ ...(labelSx || {}) }}>
              {value ? 'Admin Approved' : 'Admin Not Approved'}
            </span>
          }
        />
      ) : (
        switchComponent
      )}
      <ConfirmDialog
        open={open}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title="Change Status"
        message={<>Are you sure you want to set Admin Approved to <strong>{pendingValue ? 'Approved' : 'Not Approved'}</strong>?</>}
        confirmText="Confirm"
        cancelText="Cancel"
        isLoading={isUpdating}
        loadingText="Updating..."
        severity="primary"
      />
    </>
  );
};

export default AdminApprovedToggle;

