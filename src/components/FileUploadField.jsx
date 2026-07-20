"use client";
import React, { useRef, useState } from 'react';
import { Button } from '@mui/material';

const FileUploadField = ({
  label = "Upload Image",
  value,
  onChange,
  error,
  helperText,
  preview,
  setPreview,
  accept = "image/*",
  showRemoveButton = false,
  onRemove,
  ...props
}) => {
  const fileInputRef = useRef();
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    onChange(file);
    if (file && setPreview) setPreview(URL.createObjectURL(file));
    else if (setPreview) setPreview(null);
  };

  const handleRemove = () => {
    onChange(null);
    if (setPreview) setPreview(null);
    if (onRemove) onRemove();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onChange(file);
      if (setPreview) setPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={e => { e.preventDefault(); setDragActive(false); }}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-none p-4 text-center cursor-pointer mb-2 mt-4 transition-colors ${
        error 
          ? 'border-red-500 bg-red-50' 
          : dragActive 
            ? 'border-[#f59e42] bg-[#fff7ed]' 
            : 'border-gray-300 bg-gray-50'
      }`}
      onClick={() => fileInputRef.current.click()}
      {...props}
    >
      <Button variant="outlined" component="span">
        {value ? "Change Image" : label}
      </Button>
      <input
        type="file"
        accept={accept}
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="mt-2 text-gray-500 text-sm">
        or drag and drop image here
      </div>
      {typeof preview === 'string' && preview.trim() !== '' && preview !== 'null' && (
          <div className="relative mt-2 mx-auto" style={{ width: '180px', aspectRatio: '16/9', background: '#f3f3f3', border: '1px solid #e0e0e0', overflow: 'visible', borderRadius: 0, position: 'relative' }}>
          <img
            src={preview}
            alt={`${label} Preview`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
          />
          {showRemoveButton && onRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
              title="Remove image"
            >
              ×
            </button>
          )}
        </div>
      )}
      {error && (
        <div className="text-red-500 mt-2 text-xs">
          {helperText}
        </div>
      )}
    </div>
  );
};

export default FileUploadField;
