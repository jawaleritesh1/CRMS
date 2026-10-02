import '../styles/globals.css';
import { AuthProvider } from '../lib/authContext';
import { CallProvider } from '../lib/callContext';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';

export const metadata = {
  title: 'Ralix CRM — Hardened Enterprise Real Estate CRM',
  description: 'Enterprise Real Estate CRM with 5-Dimensional Lead State Machine, Concurrency Locking, and Immutable Invariants',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CallProvider>
            <div className="app-container">
              <Sidebar />
              <div className="main-content">
                <Header />
                <main className="page-body">{children}</main>
              </div>
            </div>
          </CallProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
