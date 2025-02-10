"use client"
import React, { useEffect } from 'react';

const Toast = ({ message, type, onClose }) => {
  
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); 

    return () => clearTimeout(timer);
  }, [onClose]);

  const backgroundColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
  };

  return (
    <div
      className={`fixed top-5 right-5 z-50 px-6 py-4 rounded-md shadow-lg text-white ${backgroundColors[type]}`}
    >
      <p>{message}</p>
    </div>
  );
};

export default Toast;
