// src/components/ui/Button.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';


const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  className = '',
  fullWidth = false,
  neon = true,
  ripple = true,
  ...props
}) => {
  // Variantlar – Cyber Neon uslubi
  const variants = {
    primary: 'bg-gradient-to-r from-neonPink to-neonPink hover:from-neonCyan hover:to-neonPink text-white shadow-md',
    secondary: 'bg-card border border-neonPink/50 text-textLight hover:bg-neonPink/10',
    outline: 'bg-transparent border-2 border-neonPink text-neonPink hover:border-neonCyan hover:text-neonCyan',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'bg-transparent text-textLight hover:text-neonPink',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const baseClasses = `
    relative inline-flex items-center justify-center gap-2
    font-medium rounded-md transition-all duration-300
    focus:outline-none focus:ring-2 focus:ring-neonCyan/50
    disabled:opacity-50 disabled:cursor-not-allowed
    ${variants[variant]}
    ${sizes[size]}
    ${fullWidth ? 'w-full' : ''}
    ${neon ? 'gru-btn-neon' : ''}
    ${ripple ? 'gru-btn-ripple' : ''}
    ${className}
  `;

  // Agar neon=true bo‘lsa, hoverda qo‘shimcha glow klass qo‘shamiz (optional)
  const combinedClassName = neon ? `${baseClasses} btn-cyber-glow` : baseClasses;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={combinedClassName}
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" size={size === 'sm' ? 16 : 20} />}
      {children}
    </motion.button>
  );
};

export default Button;