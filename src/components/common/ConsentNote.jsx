// Google/Apple orqali kirishda alohida belgi yo'q — davom etish rozilik hisoblanadi
import { Link } from 'react-router-dom';
import { T } from '../utils/T';

export default function ConsentNote() {
  return (
    <p className="auth-consent-note">
      {T('Davom etish orqali siz')} <Link to="/terms">{T('Foydalanish shartlari')}</Link> {T('va')}{' '}
      <Link to="/privacy">{T('Maxfiylik siyosati')}</Link>{T('ga rozilik bildirasiz')}
    </p>
  );
}
