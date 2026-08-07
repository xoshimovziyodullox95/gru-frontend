// src/components/ui/Spinner.jsx
import React from 'react';
import '../../styles/spinner.css';

const Spinner = ({
  size = 'md', // sm, md, lg
  variant = 'primary', // primary, neon, gradient
  className = '',
}) => {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  };

  const variantClasses = {
    primary: 'spinner-primary',
    neon: 'spinner-neon',
    gradient: 'spinner-gradient',
  };

  return (
    <div className={`inline-block ${className}`}>
      <div
        className={`${sizes[size]} rounded-full ${variantClasses[variant]}`}
        role="status"
        aria-label="loading"
      />
    </div>
  );
};

export default Spinner;