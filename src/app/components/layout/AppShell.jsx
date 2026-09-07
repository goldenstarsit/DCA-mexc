'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { href: '/dashboard', label: 'Dashboard', icon: '⌂' },
  { href: '/dca', label: 'DCA', icon: '↘' },
  { href: '/orders', label: 'Orders', icon: '↔' },
  { href: '/trades', label: 'Trades', icon: '◷' },
  { href: '/logs', label: 'Logs', icon: '≡' },
];

export default function AppShell({ children }) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-brand">
          <div className="brand-mark">D</div>
          <div>
            <div className="brand-title">DCA-MEXC</div>
            <div className="brand-subtitle">Trading Terminal</div>
          </div>
        </div>

        <nav className="desktop-nav">
          {navigation.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${active ? 'active' : ''}`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="connection-status">
          <span className="status-dot" />
          <span>System</span>
        </div>
      </header>

      <nav className="mobile-nav">
        {navigation.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav-link ${active ? 'active' : ''}`}
            >
              <span className="mobile-nav-icon">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <main className="app-content">
        {children}
      </main>
    </div>
  );
}
