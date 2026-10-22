import React, { useState } from 'react';
import { 
  X, Key, Check, AlertCircle, Eye, EyeOff, Sparkles, 
  ExternalLink, CheckCircle2, Loader2, ShieldCheck, Trash2 
} from 'lucide-react';
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
  const [tempKey, setTempKey] = useState(apiKey || '');
  const [showPassword, setShowPassword] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [probando, setProbando] = useState(false);
  const [testResult, setTestResult] = useState<{ tipo: 'success' | 'error' | null; mensaje: string }>({
    tipo: null,
    mensaje: ''
  });

  if (!isOpen) return null;

  const handleGuardar = () => {
    const keyLimpia = tempKey.trim();
    onSaveApiKey(keyLimpia);
    setGuardado(true);
    setTestResult({ tipo: null, mensaje: '' });
    setTimeout(() => setGuardado(false), 2500);
  };

  const handleEliminarClave = () => {
    if (window.confirm('¿Deseas eliminar la clave configurada en este navegador?')) {
      setTempKey('');
      onSaveApiKey('');
      setTestResult({ tipo: null, mensaje: '' });
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2000);
    }
  };

  const probarConexion = async () => {
    const keyAProbar = tempKey.trim();
    if (!keyAProbar) {
      setTestResult({
        tipo: 'error',
        mensaje: 'Por favor ingresa una API Key antes de realizar la prueba.'
      });
      return;
    }

    setProbando(true);
    setTestResult({ tipo: null, mensaje: '' });

    try {
      // Llamada real de verificación a Google AI Studio
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(keyAProbar)}`, {
        method: 'GET'
      });

      if (res.ok) {
        const data = await res.json();
        const tieneGemini = Array.isArray(data.models) && data.models.length > 0;
        setTestResult({
          tipo: 'success',
          mensaje: tieneGemini 
            ? '¡Conexión exitosa! La clave es válida y está lista para auditar expedientes con Gemini.'
            : 'Conexión recibida correctamente desde Google AI Studio.'
        });
      } else {
        const errJson = await res.json().catch(() => null);
        const mensajeApi = errJson?.error?.message || `Código de respuesta HTTP ${res.status}`;
        setTestResult({
          tipo: 'error',
          mensaje: `Error al validar la clave: ${mensajeApi}`
        });
      }
    } catch (err: unknown) {
      setTestResult({
        tipo: 'error',
        mensaje: `No fue posible conectar con Google AI Studio. Verifica tu conexión a internet o cortafuegos (${(err as Error)?.message || 'Fallo de red'}).`
      });
    } finally {
      setProbando(false);
    }
  };

  const tieneClaveActiva = Boolean(tempKey && tempKey.trim().length > 10);

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '580px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 90, 67, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #E2E8F0'
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Cabecera Institucional */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #F0FDF8 0%, #FFFFFF 100%)',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <img 
              src={logoImg} 
              alt="DUSAKAWI EPSI" 
              style={{ width: '42px', height: '42px', objectFit: 'contain' }} 
            />
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#005A43', margin: 0 }}>
                Configuración de Google Gemini API
              </h2>
              <div style={{ fontSize: '0.76rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <ShieldCheck size={13} color="#059669" />
                <span>DUSAKAWI EPSI — Auditoría Clínica con IA y Cero Inventiva</span>
              </div>
            </div>
          </div>
          <button 
            type="button" 
            className="btn btn-secondary btn-icon" 
            onClick={onClose}
            style={{ width: '36px', height: '36px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Tarjeta de Estado Actual */}
          <div style={{
            background: tieneClaveActiva ? '#F0FDF4' : '#FEF3C7',
            border: `1px solid ${tieneClaveActiva ? '#BBF7D0' : '#FDE68A'}`,
            borderRadius: '12px',
            padding: '1rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem'
          }}>
            {tieneClaveActiva ? (
              <CheckCircle2 size={20} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
            ) : (
              <AlertCircle size={20} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
            )}
            <div style={{ fontSize: '0.82rem', flex: 1 }}>
              <div style={{ fontWeight: 700, color: tieneClaveActiva ? '#065F46' : '#92400E', marginBottom: '2px' }}>
                {tieneClaveActiva ? 'Clave de API Configurada' : 'Sin Clave de API Configurada'}
              </div>
              <div style={{ color: tieneClaveActiva ? '#047857' : '#B45309', lineHeight: 1.45 }}>
                {tieneClaveActiva 
                  ? 'La IA multimodal de Gemini está habilitada para leer directamente tus archivos PDF de historias clínicas y extraer variables bajo la regla de Cero Inventiva.'
                  : 'Sin clave de API, el extractor utilizará el motor de análisis sintáctico local determinista predeterminado.'}
              </div>
            </div>
          </div>

          {/* Formulario de la Clave */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.88rem', color: '#1E293B', marginBottom: '0.5rem' }}>
              <Key size={16} color="#D97706" />
              <span>Google Gemini API Key:</span>
            </label>

            <div style={{ display: 'flex', position: 'relative', alignItems: 'center' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                style={{
                  width: '100%',
                  padding: '0.75rem 2.8rem 0.75rem 0.95rem',
                  fontSize: '0.9rem',
                  borderRadius: '10px',
                  border: '1.5px solid #CBD5E1',
                  outline: 'none',
                  fontFamily: 'monospace',
                  transition: 'border-color 0.2s',
                  background: '#FFFFFF'
                }}
                placeholder="AIzaSy..."
                value={tempKey}
                onChange={(e) => {
                  setTempKey(e.target.value);
                  setTestResult({ tipo: null, mensaje: '' });
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748B',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={showPassword ? 'Ocultar clave' : 'Mostrar clave'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            <p style={{ fontSize: '0.76rem', color: '#64748B', marginTop: '0.4rem', marginInline: '2px' }}>
              Tu clave se almacena de forma segura exclusivamente en tu navegador (<code>localStorage</code>) y nunca se comparte con servidores externos.
            </p>
          </div>

          {/* Acciones principales: Guardar, Probar, Eliminar */}
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleGuardar}
              style={{ flex: 1, minWidth: '150px', justifyContent: 'center', gap: '6px' }}
            >
              {guardado ? <Check size={16} /> : <Sparkles size={16} />}
              <span>{guardado ? '¡Clave Guardada!' : 'Guardar Clave'}</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={probarConexion}
              disabled={probando || !tempKey.trim()}
              style={{ justifyContent: 'center', gap: '6px' }}
              title="Verificar validez de la clave en Google AI Studio"
            >
              {probando ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} color="#005A43" />}
              <span>{probando ? 'Probando...' : 'Probar Conexión'}</span>
            </button>

            {tieneClaveActiva && (
              <button
                type="button"
                onClick={handleEliminarClave}
                className="btn btn-secondary"
                style={{ color: '#DC2626', borderColor: '#FCA5A5', padding: '0.6rem 0.85rem' }}
                title="Eliminar clave guardada"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          {/* Resultado de la prueba en vivo */}
          {testResult.tipo && (
            <div style={{
              background: testResult.tipo === 'success' ? '#ECFDF5' : '#FEF2F2',
              border: `1px solid ${testResult.tipo === 'success' ? '#A7F3D0' : '#FECACA'}`,
              borderRadius: '10px',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.65rem',
              fontSize: '0.82rem',
              color: testResult.tipo === 'success' ? '#065F46' : '#991B1B',
              animation: 'fadeIn 0.2s ease-in'
            }}>
              {testResult.tipo === 'success' ? (
                <CheckCircle2 size={18} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
              ) : (
                <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
              )}
              <div style={{ flex: 1, lineHeight: 1.45 }}>
                {testResult.mensaje}
              </div>
            </div>
          )}

          {/* Caja instructiva: Cómo obtener una clave gratis */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '1.15rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '6px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.84rem', color: '#334155' }}>
                ¿Cómo obtener una API Key gratuita de Google Gemini?
              </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: '#005A43',
                  textDecoration: 'none'
                }}
              >
                <span>Ir a Google AI Studio</span>
                <ExternalLink size={13} />
              </a>
            </div>

            <ol style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: '#475569', lineHeight: 1.6 }}>
              <li>Ingresa con tu cuenta de Google o institucional a <strong>Google AI Studio</strong>.</li>
              <li>Haz clic en el botón azul <strong>"Create API key"</strong>.</li>
              <li>Copia la clave generada (comienza por <code>AIzaSy...</code>) y pégala en el campo superior.</li>
              <li>Haz clic en <strong>"Guardar Clave"</strong> y luego en <strong>"Probar Conexión"</strong>.</li>
            </ol>
          </div>

        </div>

        {/* Pie del modal */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #E2E8F0',
          background: '#F8FAFC',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottomLeftRadius: '20px',
          borderBottomRightRadius: '20px'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
            Modelos soportados: <strong>gemini-2.5-flash / gemini-1.5-flash</strong>
          </div>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onClose}
            style={{ padding: '0.5rem 1.25rem' }}
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
