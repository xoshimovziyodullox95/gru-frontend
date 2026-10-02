import { motion, useReducedMotion } from 'framer-motion';
import '../../styles/card.css';

const VARIANT_CLASSES = {
  default: 'gru-card gru-card--default',
  hover3d: 'gru-card gru-card--3d',
  glass: 'gru-card gru-card--glass',
  neon: 'gru-card gru-card--neon',
};

const PADDING_CLASSES = {
  none: 'gru-card--padding-none',
  sm: 'gru-card--padding-sm',
  md: 'gru-card--padding-md',
  lg: 'gru-card--padding-lg',
};

export default function Card({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  hoverEffect = true,
  onClick,
  ...props
}) {
  const prefersReducedMotion = useReducedMotion();

  const variantClass =
    VARIANT_CLASSES[variant] ||
    VARIANT_CLASSES.default;

  const paddingClass =
    PADDING_CLASSES[padding] ||
    PADDING_CLASSES.md;

  const isInteractive =
    hoverEffect || typeof onClick === 'function';

  const cardClassName = [
    variantClass,
    paddingClass,
    hoverEffect ? 'gru-card--hoverable' : '',
    isInteractive ? 'gru-card--interactive' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const hoverAnimation =
    hoverEffect && !prefersReducedMotion
      ? {
          y: -5,
          scale: 1.015,
        }
      : undefined;

  const tapAnimation =
    isInteractive && !prefersReducedMotion
      ? {
          scale: 0.985,
        }
      : undefined;

  return (
    <motion.div
      className={cardClassName}
      onClick={onClick}
      whileHover={hoverAnimation}
      whileTap={tapAnimation}
      transition={{
        type: 'spring',
        stiffness: 320,
        damping: 24,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}