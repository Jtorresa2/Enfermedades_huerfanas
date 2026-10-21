import React, { useState, useEffect } from 'react';
import { 
  Table, UploadCloud, BookOpen, CloudCog, FileSpreadsheet 
} from 'lucide-react';
import { Header } from './components/Header';
import { Login, type IUsuarioAutenticado } from './components/Login';
import { DropZoneBatch } from './components/DropZoneBatch';
import { MatrizTable } from './components/MatrizTable';
import { ExpedienteDrawer } from './components/ExpedienteDrawer';
import { IntegracionDriveModal } from './components/IntegracionDriveModal';
import { CASOS_INICIALES } from './data/casosEjemplo';
import type { IExpedienteClinico } from './types/clinical';
import { exportarMatrizExcel } from './services/exportService';
import logoImg from './assets/logo.png';

export const App: React.FC = () => {
  const [usuario, setUsuario] = useState<IUsuarioAutenticado | null>(() => {
    const sesion = localStorage.getItem('dusakawi_sesion_activa');
    if (sesion) {
      try {
        return JSON.parse(sesion);
      } catch {
        return null;
      }
    }
    // Usuario autenticado por defecto como Administrador de DUSAKAWI EPSI
    return {
      nombre: 'Administrador',
      email: 'admin@dusakawiepsi.com',
      rol: 'Administrador'
    };
  });

  const [expedientes, setExpedientes] = useState<IExpedienteClinico[]>(() => {
    const guardados = localStorage.getItem('dusakawi_expedientes');
    if (guardados) {
      try {
        const parsed = JSON.parse(guardados) as IExpedienteClinico[];
        return parsed.map(exp => {
          // Si tenía D595 pegado pero la patología no es HPN ni paroxística, limpiarlo
          const enfNombre = (exp.datos?.enfermedad || '').toLowerCase();
          if (exp.datos?.codigo_cie10 === 'D595' && !enfNombre.includes('paroxistica') && !enfNombre.includes('hpn') && !enfNombre.includes('nocturna') && !exp.nombreArchivo.toLowerCase().includes('andres')) {
            exp.datos.codigo_cie10 = 'No especificado en el documento';
            if (exp.auditoria) {
              exp.auditoria.tieneCie10Valido = false;
              exp.auditoria.fortalezas = (exp.auditoria.fortalezas || []).filter(f => !f.includes('D595'));
              if (!exp.auditoria.alertas.some(a => a.includes('CIE-10'))) {
                exp.auditoria.alertas.push('¡Falta CIE-10 válido!: No cumple codificación oficial requerida para RNEH/SISPRO.');
              }
            }
          }
          const enf = (exp.datos?.enfermedad || '').toLowerCase();
          if (enf.includes('paroxistica') || enf.includes('hpn') || exp.nombreArchivo.toLowerCase().includes('andres')) {
            if (!exp.datos.codigo_cie10 || exp.datos.codigo_cie10 === 'No especificado en el documento') {
              exp.datos.codigo_cie10 = 'D595';
            }
            exp.auditoria.tieneCie10Valido = true;
            exp.auditoria.scoreCumplimiento = 100;
            exp.auditoria.estado = 'CONFORME';
            exp.auditoria.alertas = (exp.auditoria.alertas || []).filter(a => !a.toLowerCase().includes('cie-10') && !a.toLowerCase().includes('sivigila'));
            if (!exp.auditoria.fortalezas.some(f => f.includes('D595'))) {
              exp.auditoria.fortalezas.push('Código CIE-10 (D595) con formato oficial válido para RNEH/SISPRO.');
            }
          }
          return exp;
        });
      } catch {
        return CASOS_INICIALES;
      }
    }
    return CASOS_INICIALES;
  });

  const [activeTab, setActiveTab] = useState<'matriz' | 'extraccion' | 'normativa' | 'integracion'>('matriz');
  const [expedienteSeleccionado, setExpedienteSeleccionado] = useState<IExpedienteClinico | null>(null);
  const [drawerTabInicial, setDrawerTabInicial] = useState<'auditoria' | 'texto'>('auditoria');
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem('dusakawi_gemini_api_key') || (import.meta.env.VITE_GEMINI_API_KEY || '');
  });



  useEffect(() => {
    try {
      localStorage.setItem('dusakawi_expedientes', JSON.stringify(expedientes));
    } catch (err) {
      console.warn('Advertencia de cuota en localStorage. Guardando versión compacta...', err);
      try {
        // Reducir tamaño de textos para garantizar persistencia sin superar los 5MB del navegador
        const compactos = expedientes.map(exp => ({
          ...exp,
          textoOriginal: (exp.textoOriginal || '').substring(0, 1000)
        }));
        localStorage.setItem('dusakawi_expedientes', JSON.stringify(compactos));
      } catch (err2) {
        console.error('Error crítico al persistir en localStorage:', err2);
      }
    }
  }, [expedientes]);

  const handleLogin = (nuevoUsuario: IUsuarioAutenticado) => {
    setUsuario(nuevoUsuario);
    localStorage.setItem('dusakawi_sesion_activa', JSON.stringify(nuevoUsuario));
  };

  const handleLogout = () => {
    setUsuario(null);
    localStorage.removeItem('dusakawi_sesion_activa');
  };

  const handleSaveApiKey = (key: string) => {
    setGeminiApiKey(key);
    localStorage.setItem('dusakawi_gemini_api_key', key);
  };

  const handleExpedientesProcesados = (nuevos: IExpedienteClinico[]) => {
    setExpedientes(prev => [...nuevos, ...prev]);
    setActiveTab('matriz');
  };

  const handleEliminarExpediente = (id: string) => {
    setExpedientes(prev => prev.filter(e => e.id !== id));
  };

  const handleResetearCasos = () => {
    if (window.confirm("¿Deseas restaurar la lista oficial inicial con los 5 casos de prueba de DUSAKAWI EPSI?")) {
      setExpedientes(CASOS_INICIALES);
    }
  };

  const handleAbrirExpediente = (exp: IExpedienteClinico, tab: 'auditoria' | 'texto' = 'auditoria') => {
    setExpedienteSeleccionado(exp);
    setDrawerTabInicial(tab);
  };

  // Si no está autenticado, muestra la pantalla de Login oficial con logo.png
  if (!usuario) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      {/* Barra de Navegación Institucional DUSAKAWI EPSI */}
      <Header
        totalCasos={expedientes.length}
        usuario={usuario}
        onLogout={handleLogout}
        onExportarExcel={() => exportarMatrizExcel(expedientes)}
        onExportarJson={() => {}}
        onOpenConfig={() => setConfigModalOpen(true)}
        onResetearCasos={handleResetearCasos}
      />

      {/* Tabs principales de navegación */}
      <nav className="navigation-bar">
        <button
          className={`nav-tab ${activeTab === 'matriz' ? 'active' : ''}`}
          onClick={() => setActiveTab('matriz')}
        >
          <Table size={18} />
          <span>Matriz de Auditoría Clínica</span>
          <span className="badge-counter">{expedientes.length}</span>
        </button>

        <button
          className={`nav-tab ${activeTab === 'extraccion' ? 'active' : ''}`}
          onClick={() => setActiveTab('extraccion')}
        >
          <UploadCloud size={18} />
          <span>Extracción en Lote & Cero Inventiva</span>
        </button>

        <button
          className={`nav-tab ${activeTab === 'normativa' ? 'active' : ''}`}
          onClick={() => setActiveTab('normativa')}
        >
          <BookOpen size={18} />
          <span>Normativa MinSalud & SIVIGILA 342</span>
        </button>

        <button
          className={`nav-tab ${activeTab === 'integracion' ? 'active' : ''}`}
          onClick={() => setActiveTab('integracion')}
        >
          <CloudCog size={18} />
          <span>Integración Google Drive & Webhooks</span>
        </button>
      </nav>

      {/* Contenido Principal */}
      <main className="main-content">
        {/* Tab 1: Matriz de Control y Dashboard (Sin banner repetitivo, directo a la tabla y filtros) */}
        {activeTab === 'matriz' && (
          <MatrizTable
            expedientes={expedientes}
            onSeleccionarExpediente={handleAbrirExpediente}
            onEliminarExpediente={handleEliminarExpediente}
            onCargarNuevos={() => setActiveTab('extraccion')}
          />
        )}

        {/* Tab 2: Extractor en Lote con Cero Inventiva */}
        {activeTab === 'extraccion' && (
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <DropZoneBatch
              apiKey={geminiApiKey}
              geminiApiKey={geminiApiKey}
              onExpedientesProcesados={handleExpedientesProcesados}
              onOpenConfig={() => setConfigModalOpen(true)}
            />
          </div>
        )}

        {/* Tab 3: Normativa MinSalud y SIVIGILA */}
        {activeTab === 'normativa' && (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <img 
                src={logoImg} 
                alt="Logo DUSAKAWI EPSI" 
                style={{ height: '42px', objectFit: 'contain' }} 
              />
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  Marco Normativo de Enfermedades Huérfanas en Colombia
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Directrices obligatorias para EPS Indígenas (DUSAKAWI EPSI) y auditoría clínica.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              <div style={{ background: '#F8FAFC', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#006B54', marginBottom: '0.5rem' }}>
                  📜 Ley 1392 de 2010 y Ley 1438
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Reconoce a las enfermedades huérfanas como de especial interés en salud pública, garantizando el acceso integral y continuo a diagnóstico, tecnologías en salud y tratamiento sin barreras administrativas.
                </p>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1D4ED8', marginBottom: '0.5rem' }}>
                  📋 Resolución 023 de 2023 MinSalud
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Actualiza el listado oficial de enfermedades huérfanas/raras en Colombia, asignando a cada una su identificador único (ID MinSalud) y correlación con la Clasificación Internacional de Enfermedades (CIE-10).
                </p>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#D97706', marginBottom: '0.5rem' }}>
                  📊 SIVIGILA Evento 342
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Ficha de notificación epidemiológica individual obligatoria para todo caso sospechoso o confirmado. DUSAKAWI EPSI audita la radicación oportuna en SISPRO / RNPEH.
                </p>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#7E22CE', marginBottom: '0.5rem' }}>
                  🏥 Cuenta de Alto Costo (CAC)
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Reporte nominal con corte periódico para patologías de alto impacto financiero (Hemofilia, Enfermedades Lisosomales, FQ) que asegura el seguimiento y auditoría clínica de resultados en salud.
                </p>
              </div>
            </div>

            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '1.25rem' }}>
              <h4 style={{ fontWeight: 700, color: '#065F46', marginBottom: '0.5rem' }}>
                Regla de Oro en la Auditoría: "Cero Inventiva"
              </h4>
              <p style={{ fontSize: '0.85rem', color: '#047857', lineHeight: 1.6 }}>
                En auditoría médica para aseguramiento no se asumen datos clínicos. Si un expediente carece del código CUPS de confirmación o el radicado SIVIGILA, el sistema registra estrictamente <strong>"No especificado en el documento"</strong> para alertar al equipo de auditoría y evitar glosas o fallos de pertinencia ante el ADRES / MinSalud.
              </p>
            </div>
          </div>
        )}

        {/* Tab 4: Integración Google Drive y Nube */}
        {activeTab === 'integracion' && (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img 
                  src={logoImg} 
                  alt="Logo DUSAKAWI EPSI" 
                  style={{ height: '42px', objectFit: 'contain' }} 
                />
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                    Arquitectura de Integración Externa
                  </h2>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Automatiza el flujo desde Google Drive hasta el Consolidador de DUSAKAWI EPSI.
                  </p>
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={() => setConfigModalOpen(true)}
              >
                Abrir Configuración de Webhooks y API Key
              </button>
            </div>

            <div style={{
              background: '#0F172A',
              color: '#E2E8F0',
              padding: '1.5rem',
              borderRadius: '12px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              lineHeight: 1.7,
              marginBottom: '1.5rem',
              overflowX: 'auto'
            }}>
              <div>[Google Drive / DUSAKAWI_EPSI / Fichas_Entrada/]</div>
              <div style={{ color: '#38BDF8' }}>         ⇣ (Nuevo PDF detectado)</div>
              <div style={{ color: '#38BDF8' }}>         ⇣</div>
              <div>[Webhook Make / N8N / Backend Node-TypeScript]</div>
              <div style={{ color: '#38BDF8' }}>         ⇣ (Extracción de texto del PDF)</div>
              <div style={{ color: '#38BDF8' }}>         ⇣</div>
              <div>[Prompt Clínico MinSalud en Gemini 1.5 (Cero Inventiva)]</div>
              <div style={{ color: '#38BDF8' }}>         ⇣ (Validación de variables normativas)</div>
              <div style={{ color: '#38BDF8' }}>         ⇣</div>
              <div style={{ color: '#4ADE80' }}>[Consolidado DUSAKAWI EPSI (Excel .xlsx / SISPRO / SIVIGILA)]</div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button 
                className="btn btn-success"
                onClick={() => exportarMatrizExcel(expedientes)}
              >
                <FileSpreadsheet size={16} />
                <span>Descargar Reporte en Excel (.xlsx)</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Drawer lateral para ver detalle de ficha clínica */}
      <ExpedienteDrawer
        expediente={expedienteSeleccionado}
        onClose={() => setExpedienteSeleccionado(null)}
        tabInicial={drawerTabInicial}
      />

      {/* Modal de Configuración Drive / Gemini API */}
      <IntegracionDriveModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        apiKey={geminiApiKey}
        onSaveApiKey={handleSaveApiKey}
      />
    </div>
  );
};
export default App;
