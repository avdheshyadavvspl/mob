import React, { useState } from 'react';
import {
  Building2,
  Lock,
  Mail,
  Key,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  UserCheck,
  Zap,
} from 'lucide-react';
import { api, PRESET_ACCOUNTS } from '../api';
import { UserSession } from '../types';

interface LoginPageProps {
  onLoginSuccess: (session: UserSession) => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const session = await api.login(email.trim(), password);
      onLoginSuccess(session);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handlePresetLogin = async (preset: typeof PRESET_ACCOUNTS[0]) => {
    setEmail(preset.email);
    setPassword(preset.password);
    setLoading(true);
    setError(null);

    try {
      const session = await api.login(preset.email, preset.password);
      onLoginSuccess(session);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const companyAAccounts = PRESET_ACCOUNTS.filter((a) => a.company === 'ACME');
  const companyBAccounts = PRESET_ACCOUNTS.filter((a) => a.company === 'GLOBEX');

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '32px 16px',
        position: 'relative',
      }}
    >
      {/* Background radial glow */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div style={{ maxWidth: '1100px', width: '100%', zIndex: 1 }}>
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 14px',
              borderRadius: '9999px',
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              marginBottom: '16px',
            }}
          >
            <ShieldCheck size={16} color="#818cf8" />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a5b4fc' }}>
              Multi-Tenant Architecture & RBAC Security
            </span>
          </div>

          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '10px' }}>
            PayrollCore Gateway
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '640px', margin: '0 auto' }}>
            Multi-Company Attendance-to-Payroll System with complete data isolation, role-based access control, and LLM tool calling.
          </p>
        </div>

        {/* Multi-Tenant Security Guarantee Banner */}
        <div
          className="glass-panel"
          style={{
            padding: '16px 22px',
            marginBottom: '32px',
            background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.08), rgba(6, 182, 212, 0.08))',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Lock size={20} color="#818cf8" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
                Strict Multi-Tenant Isolation Guarantee
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                <strong>Company A's data must never be visible to Company B.</strong> Each tenant’s queries are cryptographically bound to their <code>company_id</code>.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="badge badge-acme">Acme (Company A)</span>
            <span style={{ color: 'var(--text-dim)', alignSelf: 'center' }}>≠</span>
            <span className="badge badge-globex">Globex (Company B)</span>
          </div>
        </div>

        {/* Main Grid: Custom Login (Left) + Quick One-Click Tenant Personas (Right) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '28px' }}>
          
          {/* Custom Login Form (5 cols) */}
          <div style={{ gridColumn: 'span 5' }}>
            <div className="glass-panel" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Key size={18} color="var(--accent-primary)" />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Account Login</h2>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Sign in with your organization email to access your attendance records and payroll.
              </p>

              {error && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: 'rgba(244, 63, 94, 0.15)',
                    border: '1px solid rgba(244, 63, 94, 0.4)',
                    color: '#fda4af',
                    fontSize: '0.82rem',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleCustomLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '6px', fontWeight: 600 }}>
                    CORPORATE EMAIL
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: 'rgba(0, 0, 0, 0.35)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                    }}
                  >
                    <Mail size={16} color="var(--text-dim)" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. admin@acme.com"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        width: '100%',
                        fontSize: '0.9rem',
                      }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '6px', fontWeight: 600 }}>
                    PASSWORD
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: 'rgba(0, 0, 0, 0.35)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                    }}
                  >
                    <Lock size={16} color="var(--text-dim)" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        width: '100%',
                        fontSize: '0.9rem',
                      }}
                      required
                    />
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                    Default demo password: <code>password123</code>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    marginTop: '8px',
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: 'var(--shadow-glow)',
                  }}
                >
                  {loading ? 'Authenticating...' : 'Sign In to Portal'}
                  <ArrowRight size={16} />
                </button>
              </form>
            </div>
          </div>

          {/* Quick One-Click Tenant Personas (7 cols) */}
          <div style={{ gridColumn: 'span 7', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Company A: Acme Technologies */}
            <div className="glass-panel" style={{ padding: '22px', borderLeft: '4px solid var(--accent-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={18} color="#818cf8" />
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Company A: Acme Technologies</h3>
                </div>
                <span className="badge badge-acme">22 Working Days/mo</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {companyAAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => handlePresetLogin(acc)}
                    disabled={loading}
                    style={{
                      textAlign: 'left',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>{acc.label}</span>
                        <span className={`badge ${acc.role === 'ADMIN' ? 'badge-admin' : 'badge-employee'}`}>
                          {acc.role}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {acc.desc}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#818cf8', fontSize: '0.78rem', fontWeight: 600 }}>
                      <span>Select</span>
                      <ArrowRight size={14} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Company B: Globex Industries */}
            <div className="glass-panel" style={{ padding: '22px', borderLeft: '4px solid var(--accent-cyan)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={18} color="#22d3ee" />
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Company B: Globex Industries</h3>
                </div>
                <span className="badge badge-globex">20 Working Days/mo</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {companyBAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => handlePresetLogin(acc)}
                    disabled={loading}
                    style={{
                      textAlign: 'left',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.4)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>{acc.label}</span>
                        <span className={`badge ${acc.role === 'ADMIN' ? 'badge-admin' : 'badge-employee'}`}>
                          {acc.role}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {acc.desc}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#22d3ee', fontSize: '0.78rem', fontWeight: 600 }}>
                      <span>Select</span>
                      <ArrowRight size={14} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
