import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, Settings, LogOut, User, ChevronDown, FileSpreadsheet } from 'lucide-react';
import logoImg from '../assets/logo.png';
import type { IUsuarioAutenticado } from './Login';

interface HeaderProps {
  totalCasos: number;
  usuario: IUsuarioAutenticado | null;
  onLogout: () => void;
  onExportarExcel: () => void;
  onExportarJson: () => void;
  onOpenConfig: () => void;
  onResetearCasos: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalCasos,
  usuario,
  onLogout,
  onExportarExcel,
  onOpenConfig,
  onResetearCasos
}) => {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickAfuera = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickAfuera);
    return () => document.removeEventListener('mousedown', handleClickAfuera);
  }, []);

  return (
    <header className="navbar">
      {/* Lado Izquierdo: Identidad y Marca Institucional */}
      <div className="brand-wrapper">
        <div className="brand-logo-container">
          <img
            src={logoImg}
            alt="Logo DUSAKAWI EPSI"
            className="navbar-brand-logo"
          />
        </div>
        <div className="brand-titles">
          <h1>
            DUSAKAWI EPSI
          </h1>
          <p>
            Módulo Clínico de Extracción y Auditoría de Enfermedades Huérfanas
            <span style={{ marginLeft: '8px', background: 'rgba(255,255,255,0.2)', padding: '1px 6px', borderRadius: '10px', fontSize: '0.75rem' }}>
              {totalCasos} expedientes cargados
            </span>
          </p>
        </div>
      </div>

      {/* Lado Derecho: Acciones y Usuario en toda la esquina */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginLeft: 'auto' }}>
        {/* Botón de restablecer */}
        <div className="nav-actions">
          <button
            className="btn btn-secondary"
            onClick={onResetearCasos}
            title="Recargar expedientes oficiales de prueba"
            style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
          >
            <RefreshCw size={15} />
            <span>Restablecer</span>
          </button>
        </div>

        {/* Separador vertical sutil */}
        {usuario && (
          <div style={{ width: '1px', height: '28px', background: 'rgba(255, 255, 255, 0.25)' }} />
        )}

        {/* Menú de Usuario Administrador en TODA LA ESQUINA */}
        {usuario && (
          <div className="user-dropdown-container" ref={dropdownRef} style={{ position: 'relative' }}>
            <div
              className="user-profile-badge"
              onClick={() => setMenuAbierto(!menuAbierto)}
              style={{
                cursor: 'pointer',
                userSelect: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginRight: 0,
                background: menuAbierto ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.16)',
                transition: 'all 0.2s ease'
              }}
              title="Opciones de Administrador"
            >
              <div className="user-avatar-circle">
                <User size={15} />
              </div>
              <span className="user-name" style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                Administrador
              </span>
              <ChevronDown
                size={14}
                style={{
                  transition: 'transform 0.2s ease',
                  transform: menuAbierto ? 'rotate(180deg)' : 'rotate(0deg)',
                  opacity: 0.9
                }}
              />
            </div>

            {menuAbierto && (
              <div
                className="user-dropdown-menu"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  background: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 12px 28px -4px rgba(0, 45, 30, 0.3), 0 8px 12px -6px rgba(0, 0, 0, 0.12)',
                  minWidth: '220px',
                  zIndex: 100,
                  border: '1px solid #E2E8F0',
                  overflow: 'hidden',
                  animation: 'fadeIn 0.15s ease-out'
                }}
              >
                <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #F1F5F9', background: '#F8FAF9' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>
                    Sesión activa
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>
                    {usuario.email || 'admin@dusakawiepsi.com'}
                  </div>
                </div>

                <div style={{ padding: '0.4rem' }}>
                  <button
                    onClick={() => {
                      setMenuAbierto(false);
                      onExportarExcel();
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.65rem 0.85rem',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      color: '#0F172A',
                      background: 'none',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F0FDF8')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <FileSpreadsheet size={16} color="#005A43" />
                    <span>Exportar a Excel (.xlsx)</span>
                  </button>

                  <button
                    onClick={() => {
                      setMenuAbierto(false);
                      onOpenConfig();
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.65rem 0.85rem',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      color: '#0F172A',
                      background: 'none',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F0FDF8')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <Settings size={16} color="#005A43" />
                    <span>Configuración & API</span>
                  </button>

                  <div style={{ height: '1px', background: '#F1F5F9', margin: '0.3rem 0' }} />

                  <button
                    onClick={() => {
                      setMenuAbierto(false);
                      onLogout();
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.65rem 0.85rem',
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      color: '#DC2626',
                      background: 'none',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FEF2F2')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <LogOut size={16} color="#DC2626" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
