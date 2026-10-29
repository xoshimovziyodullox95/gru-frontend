export default function UniversalBankLogo({ size = 24, className = '' }) {
  return (
    <img
      src="/images/logo/universalbank.jpg"
      alt=""
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      loading="eager"
      decoding="async"
      style={{ width: size, height: size, objectFit: 'contain', flex: '0 0 auto' }}
    />
  );
}
