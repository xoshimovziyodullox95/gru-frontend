// src/components/common/ToggleSwitch.jsx
// iOS 17/18 uslubidagi shaffof (glass) switch — SettingsModal'dagi
// bildirishnoma sozlamalarida va boshqa joylarda qayta ishlatiladi.
export default function ToggleSwitch({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`ios-toggle-switch ${checked ? 'on' : ''}`}
    >
      <span className="ios-toggle-knob" />
    </button>
  );
}