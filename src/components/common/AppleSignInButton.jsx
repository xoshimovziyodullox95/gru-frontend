import toast from 'react-hot-toast';
import { APPLE_LOGIN_ENABLED, signInWithApple } from '../utils/googleAuth';
import { markAccountCreated } from '../../hooks/useGuestMode';
import { T } from '../utils/T';

// Google tugmasi ostida turadi; Apple sozlanmaguncha ko'rinmaydi
export default function AppleSignInButton() {
  if (!APPLE_LOGIN_ENABLED) return null;

  const handleClick = async () => {
    try {
      markAccountCreated();
      await signInWithApple();
    } catch {
      toast.error(T('Apple orqali kirishda xatolik'));
    }
  };

  return (
    <button type="button" onClick={handleClick} className="google-btn apple-btn">
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M16.37 12.6c-.02-2.3 1.88-3.4 1.96-3.45-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.47.83-.72 0-1.82-.81-3-.79-1.54.02-2.96.9-3.75 2.27-1.6 2.78-.41 6.9 1.15 9.15.76 1.1 1.67 2.34 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.77.74 2.98.72 1.23-.02 2.01-1.12 2.76-2.23.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.4-.92-2.42-3.66zM14.1 5.85c.63-.77 1.06-1.83.94-2.9-.91.04-2.02.61-2.67 1.37-.58.67-1.1 1.76-.96 2.8 1.02.08 2.06-.52 2.69-1.27z" />
      </svg>
      {T('Apple orqali kirish')}
    </button>
  );
}
