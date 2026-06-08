import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

const LINKS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/board', label: 'Board', end: false },
  { to: '/help', label: 'How to use', end: false },
];

export function NavBar() {
  const logout = useAuthStore((s) => s.logout);
  const username = useAuthStore((s) => s.username);

  return (
    <nav className="flex items-center gap-1">
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) =>
            `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-brand-50 text-brand-700'
                : 'text-slate-600 hover:bg-slate-100'
            }`
          }
        >
          {link.label}
        </NavLink>
      ))}
      <div className="ml-auto flex items-center gap-3">
        {username && (
          <span className="text-sm text-slate-500">{username}</span>
        )}
        <button
          onClick={logout}
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
