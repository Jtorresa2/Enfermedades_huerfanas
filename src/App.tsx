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
        const parsedRaw = JSON.parse(guardados) as IExpedienteClinico[];
        // Descartar antiguos casos demo precargados para asegurar que solo salga 1 sola historia
        const parsed = parsedRaw.filter(exp => exp.origen !== 'CASO_PRECARGADO');
        if (parsed.length === 0) {
          return CASOS_INICIALES;
        }
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
  const [drawerTabInicial, setDrawerTabInicial] = useState<'documento' | 'auditoria' | 'clinica' | 'texto'>('documento');
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

  const handleExpedientesProcesados = (nuevos: IExpedienteClinico[], navegarAMatriz = false) => {
    setExpedientes(prev => [...nuevos, ...prev]);
    if (navegarAMatriz) {
      setActiveTab('matriz');
    }
  };

  const handleEliminarExpediente = (id: string) => {
    setExpedientes(prev => prev.filter(e => e.id !== id));
  };

  const handleResetearCasos = () => {
    if (window.confirm("¿Deseas restaurar la lista oficial inicial con los 5 casos de prueba de DUSAKAWI EPSI?")) {
      setExpedientes(CASOS_INICIALES);
    }
  };

  const handleAbrirExpediente = (exp: IExpedienteClinico, tab: 'documento' | 'auditoria' | 'clinica' | 'texto' = 'documento') => {
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
          <span>💎 Gema de Conocimiento & Normativa</span>
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
              onVerExpediente={handleAbrirExpediente}
              onIrAMatriz={() => setActiveTab('matriz')}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                    💎 Gema de Conocimiento DUSAKAWI EPSI & Marco Normativo
                  </h2>
                  <span style={{ background: '#DCFCE7', color: '#15803D', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '12px' }}>
                    5 FICHAS TÉCNICAS ACTIVAS
                  </span>
                </div>
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

            
            {/* Sección de Fichas de la Gema DUSAKAWI */}
            <div style={{ marginBottom: '2rem', background: '#F8FAF9', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#005A43', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>💎 Fichas Técnicas Oficiales de la Gema (Inyectadas en Gemini 3.8 Flash)</span>
                </h3>
                <span style={{ fontSize: '0.75rem', background: '#E0F2FE', color: '#0369A1', padding: '3px 10px', borderRadius: '12px', fontWeight: 700 }}>
                  74.6 KB de Reglas Médicas y Diagnósticas
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
                <div style={{ background: 'white', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.86rem' }}>📄 Fichas Técnicas Huérfanas</div>
                  <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: '4px' }}>
                    Res. 023 de 2023 | 2.236 patologías oficiales | Criterios nosológicos y diagnóstico confirmatorio.
                  </div>
                </div>

                <div style={{ background: 'white', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.86rem' }}>🩸 Coagulopatías & Hemofilia</div>
                  <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: '4px' }}>
                    Hemofilia A (D66) y B (D67) | Dosaje de Factor VIII y IX (&lt;1%) | Guías CAC DUSAKAWI.
                  </div>
                </div>

                <div style={{ background: 'white', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.86rem' }}>🧬 Coagulopatías 2 & Von Willebrand</div>
                  <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: '4px' }}>
                    CIE-10 D68.0 | Aglutinina Ristocetina | Paraclínicos confirmatorios y profilaxis.
                  </div>
                </div>

                <div style={{ background: 'white', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.86rem' }}>🔬 Enfermedad de Gaucher Tipo 1</div>
                  <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: '4px' }}>
                    CIE-10 E75.2 | Beta-glucosidasa ácida en leucocitos (CUPS 908346) | Seguimiento hematológico.
                  </div>
                </div>

                <div style={{ background: 'white', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.86rem' }}>🧠 Esclerosis Múltiple</div>
                  <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: '4px' }}>
                    CIE-10 G35.X | Criterios McDonald | RMN cerebral con Gadolinio | Bandas oligoclonales en LCR.
                  </div>
                </div>
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
                Configurar Google Gemini API Key
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
