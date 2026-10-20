import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, AlertCircle, ShieldCheck, KeyRound } from 'lucide-react';
import logoImg from '../assets/logo.png';

export interface IUsuarioAutenticado {
  nombre: string;
  email: string;
  rol: string;
  sede?: string;
}

interface LoginProps {
  onLogin: (usuario: IUsuarioAutenticado) => void;
}

export const CREDENCIALES_SISTEMA = {
  email: 'admin@dusakawiepsi.com',
  password: 'Dusakawi2026*'
};

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('admin@dusakawiepsi.com');
  const [password, setPassword] = useState('Dusakawi2026*');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailNorm = email.trim().toLowerCase();
    const passNorm = password.trim();

    if (!emailNorm || !passNorm) {
      setError('Por favor ingresa tu correo institucional y contraseña.');
      return;
    }

    if (emailNorm !== CREDENCIALES_SISTEMA.email || passNorm !== CREDENCIALES_SISTEMA.password) {
      setError('Credenciales no válidas. Verifica correo y contraseña.');
      return;
    }

    setCargando(true);
    setError('');

    setTimeout(() => {
      onLogin({
        nombre: 'Administrador',
        email: CREDENCIALES_SISTEMA.email,
        rol: 'Administrador'
      });
      setCargando(false);
    }, 400);
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        {/* Logo Institucional Oficial */}
        <div className="login-logo-container">
          <img
            src={logoImg}
            alt="Logo DUSAKAWI EPSI"
            className="login-logo"
          />
        </div>

        <div className="login-header">
          <h2>DUSAKAWI EPSI</h2>
          <p className="login-subtitle">Entidad Promotora de Salud Indígena</p>
          <div className="login-badge-modulo">
            <ShieldCheck size={14} /> Módulo de Extracción y Auditoría de Enfermedades Huérfanas
          </div>
        </div>

        {error && (
          <div className="login-alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Correo Electrónico Institucional:</label>
            <div className="input-with-icon">
              <Mail size={18} />
              <input
                type="email"
                placeholder="admin@dusakawiepsi.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Contraseña de Acceso:</label>
            <div className="input-with-icon">
              <Lock size={18} />
              <input
                type="password"
                placeholder="Dusakawi2026*"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Recordatorio de Credenciales para Desarrollo */}
          <div style={{
            background: '#F0FDF4',
            border: '1px solid #BBF7D0',
            borderRadius: '8px',
            padding: '0.65rem 0.85rem',
            fontSize: '0.78rem',
            color: '#065F46',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <KeyRound size={16} color="#059669" />
            <div>
              <strong>Credenciales de desarrollo:</strong><br />
              <code>admin@dusakawiepsi.com</code> / <code>Dusakawi2026*</code>
            </div>
          </div>

          <button type="submit" className="btn-login-submit" disabled={cargando}>
            {cargando ? 'Validando Credenciales...' : 'Ingresar al Sistema'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="login-footer">
          <p>
            DUSAKAWI EPSI
          </p>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '4px' }}>
            Jtorresa
          </div>
        </div>
      </div>
    </div>
  );
};
