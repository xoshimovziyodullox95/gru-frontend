// src/components/ui/Card.jsx
import React from 'react';
import { motion } from 'framer-motion';
import '../../styles/card.css';

const Card = ({
  children,
  variant = 'default', // default, hover3d, glass, neon
  padding = 'md',
  className = '',
  hoverEffect = true,
  ...props
}) => {
  const paddings = {
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-7',
    none: 'p-0',
  };

  const variantClasses = {
    default: 'cyber-card',
    hover3d: 'cyber-card cyber-card-3d',
    glass: 'cyber-card-glass',
    neon: 'cyber-card-neon',
  };

  const baseClass = `
    rounded-xl transition-all duration-300
    ${variantClasses[variant]}
    ${paddings[padding]}
    ${hoverEffect ? 'hover-scale' : ''}
    ${className}
  `;

  return (
    <motion.div
      className={baseClass}
      whileHover={hoverEffect ? { y: -5, transition: { duration: 0.2 } } : {}}
      transition={{ type: 'spring', stiffness: 300 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default Card;