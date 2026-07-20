"use client";
import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';
import Cropper from 'react-easy-crop';

const CropImage = ({ open, imageSrc, onClose, onCropComplete }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const handleCropComplete = (_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleDone = () => {
    onCropComplete(croppedAreaPixels);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} disableScrollLock maxWidth="sm" fullWidth>
      <DialogTitle className="bg-orange-100 text-orange-900">Crop Image</DialogTitle>
      <DialogContent className="flex flex-col items-center bg-orange-50">
        <div className="w-full h-64 relative flex items-center justify-center">
          <div className="absolute w-full h-full pointer-events-none z-20">
            <div className="absolute top-1/2 left-1/2 w-[220px] h-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#E06B00]" style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }} />
          </div>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
            cropShape="round"
          />
        </div>
        <Slider
          value={zoom}
          min={1}
          max={3}
          step={0.1}
          onChange={(_, value) => setZoom(value)}
          className="mt-4 w-3/4"
        />
      </DialogContent>
      <DialogActions className="bg-orange-50">
        <Button onClick={onClose} color="secondary" variant="outlined">Cancel</Button>
        <Button onClick={handleDone} color="primary" variant="contained">Done</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CropImage;

