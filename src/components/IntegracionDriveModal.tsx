import React, { useState } from 'react';
import { X, Key, Workflow, Check, Send } from 'lucide-react';
import logoImg from '../assets/logo.png';

interface IntegracionDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
}

export const IntegracionDriveModal: React.FC<IntegracionDriveModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey
}) => {
  const [tempKey, setTempKey] = useState(apiKey);
  const [carpetaDrive, setCarpetaDrive] = useState('Google Drive / DUSAKAWI_EPSI / Fichas_Huerfanas_Entrada');
  const [webhookUrl, setWebhookUrl] = useState('https://hook.us1.make.com/ejemplo-webhook-dusakawi');
  const [guardado, setGuardado] = useState(false);
  const [simulando, setSimulando] = useState(false);
  const [mensajeSimulacion, setMensajeSimulacion] = useState('');

  if (!isOpen) return null;

  const guardarConfiguracion = () => {
    onSaveApiKey(tempKey);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2000);
  };

  const simularWebhook = () => {
    setSimulando(true);
    setMensajeSimulacion('Enviando evento de prueba a Webhook...');
    setTimeout(() => {
      setSimulando(false);
      setMensajeSimulacion('✅ Webhook disparado: Se simularon 3 fichas detectadas en Google Drive.');
      setTimeout(() => setMensajeSimulacion(''), 3000);
    }, 1200);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '650px',
        maxHeight: '90vh',
        overflowY: 'auto',
        margin: 'auto',
        boxShadow: 'var(--shadow-xl)',
        display: 'flex',
        flexDirection: 'column'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img 
              src={logoImg} 
              alt="DUSAKAWI EPSI" 
              style={{ width: '40px', height: '40px', objectFit: 'contain' }} 
            />
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                Conexión Google Drive, Make & API Gemini
              </h2>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                DUSAKAWI EPSI — Automatización de Fichas Clínicas
              </div>
            </div>
          </div>
          <button className="btn btn-secondary btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {/* Sección API Key */}
          <div style={{ marginBottom: '1.75rem', background: '#F8FAFC', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Key size={18} color="#D97706" />
              <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                Google Gemini API Key (Opcional):
              </label>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Si configuras tu clave, el módulo llamará directamente al modelo Gemini 1.5 con el prompt de MinSalud. Si la dejas vacía, se utilizará el motor analítico determinista local con regla Cero Inventiva.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="password"
                className="search-input"
                style={{ flex: 1, paddingLeft: '0.85rem' }}
                placeholder="AIzaSy..."
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
              />
              <button className="btn btn-primary" onClick={guardarConfiguracion}>
                {guardado ? <Check size={16} /> : null}
                <span>{guardado ? 'Guardado' : 'Guardar Clave'}</span>
              </button>
            </div>
          </div>

          {/* Sección Google Drive / N8N / Make */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Workflow size={18} color="#2563EB" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                Flujo de Procesamiento Desatendido (Nube / Drive)
              </h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Puedes conectar una carpeta de Google Drive de DUSAKAWI EPSI mediante N8N o Make.com para procesar expedientes automáticamente apenas un auditor o médico los deposite.
            </p>

            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '1rem', fontSize: '0.82rem', marginBottom: '1rem' }}>
              <div style={{ fontWeight: 700, color: '#065F46', marginBottom: '0.35rem' }}>
                Pasos para Configuración en Make o N8N:
              </div>
              <ol style={{ paddingLeft: '1.2rem', color: '#047857', lineHeight: 1.6 }}>
                <li>Crear la carpeta en Drive: <code>/Fichas_Entrada/</code>.</li>
                <li>Trigger: <em>Watch Files in Folder</em> (Al subir nuevo PDF).</li>
                <li>Módulo HTTP: Envía el texto a la API de Gemini con el prompt oficial de Cero Inventiva.</li>
                <li>Salida: Inserta la fila en la Matriz Excel de DUSAKAWI EPSI o dispara el Webhook.</li>
              </ol>
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                Ruta de Carpeta Drive Monitoreada:
              </label>
              <input
                type="text"
                className="search-input"
                style={{ paddingLeft: '0.85rem' }}
                value={carpetaDrive}
                onChange={(e) => setCarpetaDrive(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                URL del Webhook (Make / N8N / Backend):
              </label>
              <input
                type="text"
                className="search-input"
                style={{ paddingLeft: '0.85rem' }}
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
            </div>

            <button 
              className="btn btn-secondary" 
              onClick={simularWebhook}
              disabled={simulando}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Send size={15} />
              <span>{simulando ? 'Probando...' : 'Probar Envío de Webhook de Prueba'}</span>
            </button>

            {mensajeSimulacion && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: '#059669', textAlign: 'center', fontWeight: 600 }}>
                {mensajeSimulacion}
              </div>
            )}
          </div>
        </div>

        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--border-color)',
          background: '#F8FAFC',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
