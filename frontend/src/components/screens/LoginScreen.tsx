'use client';
import * as React from 'react';
import { XS } from '@/lib/tokens';
import { Icon } from '@/components/ui/Icon';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<void> | void;
  loading?: boolean;
  error?: string | null;
}

export function LoginScreen({ onLogin, loading, error }: LoginScreenProps) {
  const [email, setEmail] = React.useState('leo@xusport.fr');
  const [password, setPassword] = React.useState('');
  const [showPwd, setShowPwd] = React.useState(false);
  const [shake, setShake] = React.useState(false);

  React.useEffect(() => {
    if (error) {
      setShake(true);
      const t = setTimeout(() => setShake(false), 400);
      return () => clearTimeout(t);
    }
  }, [error]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    await onLogin(email, password);
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: '#06081A',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,0.35), transparent 65%),
            radial-gradient(ellipse 60% 40% at 80% 110%, rgba(139,92,246,0.18), transparent 60%),
            linear-gradient(180deg, #0B1020 0%, #06081A 100%)
          `,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.25,
          backgroundImage: `
            linear-gradient(rgba(167,139,250,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(167,139,250,0.06) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
          maskImage:
            'radial-gradient(ellipse 70% 50% at 50% 30%, black, transparent 80%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 70% 50% at 50% 30%, black, transparent 80%)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: `conic-gradient(from 0deg, ${XS.v0}, ${XS.v2}, ${XS.v3}, ${XS.v1}, ${XS.v0})`,
          filter: 'blur(36px)',
          opacity: 0.55,
          animation: 'xs-orb 8s linear infinite',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 5,
          height: '100%',
          padding: '78px 28px 36px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 36,
          }}
        >
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 22,
              background: `linear-gradient(135deg, ${XS.v2}, ${XS.v0})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 16px 48px ${XS.vGlow}, inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -16px 32px rgba(0,0,0,0.25)`,
              fontFamily: XS.font,
              fontSize: 32,
              fontWeight: 800,
              color: '#fff',
              letterSpacing: -1,
              marginBottom: 18,
            }}
          >
            XS
          </div>
          <div
            style={{
              fontFamily: XS.font,
              fontSize: 32,
              fontWeight: 800,
              color: XS.fg0,
              letterSpacing: -0.8,
            }}
          >
            XuSport
          </div>
          <div
            style={{
              fontFamily: XS.mono,
              fontSize: 11,
              color: XS.v3,
              letterSpacing: 2.4,
              textTransform: 'uppercase',
              marginTop: 4,
              fontWeight: 500,
            }}
          >
            Calisthenics · au poids du corps
          </div>
        </div>

        <div style={{ marginBottom: 22 }}>
          <h1
            style={{
              margin: 0,
              fontFamily: XS.font,
              fontSize: 26,
              fontWeight: 700,
              color: XS.fg0,
              letterSpacing: -0.6,
            }}
          >
            Bon retour
          </h1>
          <div
            style={{
              fontFamily: XS.font,
              fontSize: 14,
              color: XS.fg2,
              marginTop: 4,
            }}
          >
            Continuez votre progression.
          </div>
        </div>

        <form
          onSubmit={submit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            animation: shake ? 'xs-shake 360ms ease' : 'none',
          }}
        >
          <Field label="Email" icon="mail">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@xusport.fr"
              autoComplete="email"
              style={fieldInputStyle}
            />
          </Field>

          <Field
            label="Mot de passe"
            icon="lock"
            right={
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: XS.fg2,
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Icon name={showPwd ? 'eyeOff' : 'eye'} size={18} />
              </button>
            }
          >
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              style={fieldInputStyle}
            />
          </Field>

          {error && (
            <div
              style={{
                fontFamily: XS.font,
                fontSize: 12,
                color: XS.danger,
                marginTop: 2,
                textAlign: 'center',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8,
              height: 56,
              borderRadius: 18,
              border: 'none',
              background: loading
                ? XS.v0
                : `linear-gradient(135deg, ${XS.v2}, ${XS.v0})`,
              color: '#fff',
              fontFamily: XS.font,
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: 0.2,
              cursor: loading ? 'wait' : 'pointer',
              boxShadow: `0 12px 32px ${XS.vGlow}, inset 0 1px 0 rgba(255,255,255,0.2)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              transition: 'transform 120ms',
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    animation: 'xs-spin 700ms linear infinite',
                  }}
                />
                Connexion…
              </>
            ) : (
              <>
                Se connecter <Icon name="arrowR" size={18} stroke={2.4} />
              </>
            )}
          </button>
        </form>

        <div style={{ flex: 1 }} />

        <div
          style={{
            textAlign: 'center',
            fontFamily: XS.font,
            fontSize: 12,
            color: XS.fg3,
            marginTop: 16,
          }}
        >
          Pas de compte ? L&apos;inscription se fait sur invitation.
        </div>
      </div>
    </div>
  );
}

const fieldInputStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  border: 'none',
  background: 'transparent',
  fontFamily: XS.font,
  fontSize: 15,
  fontWeight: 500,
  color: XS.fg0,
  padding: 0,
  height: '100%',
};

function Field({
  label,
  icon,
  right,
  children,
}: {
  label: string;
  icon: 'mail' | 'lock';
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [focused, setFocused] = React.useState(false);
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span
        style={{
          fontFamily: XS.mono,
          fontSize: 10,
          color: XS.fg3,
          letterSpacing: 1.4,
          textTransform: 'uppercase',
          fontWeight: 600,
        }}
      >
        {label}
      </span>
      <div
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          height: 56,
          padding: '0 16px',
          borderRadius: 16,
          background: 'rgba(30,41,59,0.5)',
          border: `1px solid ${focused ? XS.v2 : XS.hairline}`,
          boxShadow: focused ? `0 0 0 4px ${XS.v1}22` : 'none',
          transition: 'border 150ms, box-shadow 150ms',
          backdropFilter: 'blur(10px)',
        }}
      >
        <span style={{ color: focused ? XS.v3 : XS.fg2, display: 'flex' }}>
          <Icon name={icon} size={18} />
        </span>
        {children}
        {right}
      </div>
    </label>
  );
}
