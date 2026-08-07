// src/components/ui/Input.jsx
import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import '../../styles/input.css';

const Input = forwardRef(({
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  variant = 'default', // default, neon, glass
  size = 'md',
  fullWidth = false,
  icon: Icon,
  required = false,
  disabled = false,
  className = '',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-5 py-3 text-lg',
  };

  const variantClasses = {
    default: 'cyber-input',
    neon: 'cyber-input-neon',
    glass: 'cyber-input-glass',
  };

  const baseInputClass = `
    w-full rounded-md transition-all duration-200
    bg-dark-card text-textLight placeholder:text-gray-500
    focus:outline-none focus:ring-2 focus:ring-neonCyan/60
    disabled:opacity-60 disabled:cursor-not-allowed
    ${variantClasses[variant]}
    ${sizes[size]}
    ${error ? 'border-neonPink focus:ring-neonPink' : ''}
    ${className}
  `;

  return (
    <div className={`${fullWidth ? 'w-full' : ''} mb-4`}>
      {label && (
        <label className="block text-sm font-medium text-textLight mb-1.5">
          {label} {required && <span className="text-neonPink">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon size={18} />
          </div>
        )}
        <input
          ref={ref}
          type={inputType}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`${baseInputClass} ${Icon ? 'pl-10' : ''} ${isPassword ? 'pr-10' : ''}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-neonCyan transition"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-sm text-neonPink flex items-center gap-1"
        >
          <AlertCircle size={14} /> {error}
        </motion.p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;