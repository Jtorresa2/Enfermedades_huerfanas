import React, { useState, useEffect, useRef } from 'react';
import { 
  X, CheckCircle2, AlertTriangle, FileText, 
  ShieldCheck, User, Stethoscope, Pill, Activity, 
  Copy, Check, MapPin, Calendar, Building2, 
  Download, ShieldAlert, ExternalLink, Upload 
} from 'lucide-react';
import logoImg from '../assets/logo.png';
import type { IExpedienteClinico } from '../types/clinical';
import { 
  obtenerArchivoDeCache, 
  obtenerArchivoDeCacheAsync, 
  registrarArchivoEnCache,
  generarPdfHistoriaClinicaBlob
} from '../services/exportService';
import { REAL_ANDRES_GIL_PDF_BASE64 } from '../data/realPdfBase64';

interface ExpedienteDrawerProps {
  expediente: IExpedienteClinico | null;
  onClose: () => void;
  tabInicial?: 'documento' | 'auditoria' | 'clinica' | 'texto';
}

const toArray = (val: unknown): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(v => String(v));
  if (typeof val === 'string') {
    return val.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [String(val)];
};

export const ExpedienteDrawer: React.FC<ExpedienteDrawerProps> = ({
  expediente,
  onClose,
  tabInicial = 'documento'
}) => {
  const [tabActiva, setTabActiva] = useState<'documento' | 'auditoria' | 'clinica' | 'texto'>(tabInicial);
  const [vistaModalidad, setVistaModalidad] = useState<'archivo' | 'historia'>('archivo');
  const [copiado, setCopiado] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeUrlRef = useRef<string | null>(null);

  const actualizarPdfUrl = (nuevaUrl: string | null) => {
    if (activeUrlRef.current && activeUrlRef.current !== nuevaUrl) {
      URL.revokeObjectURL(activeUrlRef.current);
    }
    activeUrlRef.current = nuevaUrl;
    setPdfUrl(nuevaUrl);
  };

  const handleAdjuntarPdfManual = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !expediente) return;

    registrarArchivoEnCache(expediente.nombreArchivo, file);
    registrarArchivoEnCache(file.name, file);
    const url = URL.createObjectURL(file);
    actualizarPdfUrl(url);
  };

  useEffect(() => {
    let cancelado = false;

    async function resolverPdf() {
      if (!expediente) {
        actualizarPdfUrl(null);
        return;
      }

      // 1. Intentar desde memoria inmediata por ID único primero
      const archivoMem = obtenerArchivoDeCache(expediente.id) ||
                         obtenerArchivoDeCache(expediente.codigoCaso) ||
                         obtenerArchivoDeCache(expediente.nombreArchivo);
      if (archivoMem) {
        const blobPdf = archivoMem.type === 'application/pdf'
          ? archivoMem
          : new Blob([archivoMem], { type: 'application/pdf' });
        actualizarPdfUrl(URL.createObjectURL(blobPdf));
        return;
      }

      // 2. Intentar desde IndexedDB por ID único primero
      const archivoIdb = (await obtenerArchivoDeCacheAsync(expediente.id)) ||
                         (await obtenerArchivoDeCacheAsync(expediente.codigoCaso)) ||
                         (await obtenerArchivoDeCacheAsync(expediente.nombreArchivo));
      if (archivoIdb && !cancelado) {
        const blobPdf = archivoIdb.type === 'application/pdf'
          ? archivoIdb
          : new Blob([archivoIdb], { type: 'application/pdf' });
        actualizarPdfUrl(URL.createObjectURL(blobPdf));
        return;
      }

      const esCasoDemoOficial = expediente.id === 'EXP-2026-836' && expediente.codigoCaso === 'DU-AUD-836';
      const esBase64Andres = Boolean(
        expediente.archivoBase64 &&
        expediente.archivoBase64.startsWith(REAL_ANDRES_GIL_PDF_BASE64.substring(0, 50))
      );

      // 3. Si el expediente tiene archivoBase64 guardado de su archivo real
      if (expediente.archivoBase64 && (!esBase64Andres || esCasoDemoOficial) && !cancelado) {
        try {
          const cleanB64 = expediente.archivoBase64.replace(/^data:application\/pdf;base64,/, '').replace(/^data:.*?;base64,/, '').trim();
          const raw = atob(cleanB64);
          const rawLength = raw.length;
          const uInt8Array = new Uint8Array(rawLength);
          for (let i = 0; i < rawLength; ++i) {
            uInt8Array[i] = raw.charCodeAt(i);
          }
          const blob = new Blob([uInt8Array], { type: 'application/pdf' });
          registrarArchivoEnCache(expediente.id, blob);
          registrarArchivoEnCache(expediente.nombreArchivo, blob);
          actualizarPdfUrl(URL.createObjectURL(blob));
          return;
        } catch (e) {
          console.warn('Error cargando PDF desde base64:', e);
        }
      }

      // 4. Caso oficial precargado Andres Gil Gil (EXP-2026-836) ÚNICAMENTE
      if (esCasoDemoOficial && !cancelado) {
        try {
          const raw = atob(REAL_ANDRES_GIL_PDF_BASE64);
          const rawLength = raw.length;
          const uInt8Array = new Uint8Array(rawLength);
          for (let i = 0; i < rawLength; ++i) {
            uInt8Array[i] = raw.charCodeAt(i);
          }
          const blob = new Blob([uInt8Array], { type: 'application/pdf' });
          registrarArchivoEnCache(expediente.id, blob);
          registrarArchivoEnCache(expediente.nombreArchivo, blob);
          actualizarPdfUrl(URL.createObjectURL(blob));
          return;
        } catch (e) {
          console.warn('Error con REAL_ANDRES_GIL_PDF_BASE64:', e);
        }

        try {
          const resp = await fetch('/documentos/ANDRES_GIL_GIL_HCL_DUSAKAWI_IPS_CONTROL_HEMATOLOGIA_06_08_2026.pdf');
          if (resp.ok) {
            const blob = await resp.blob();
            registrarArchivoEnCache(expediente.id, blob);
            registrarArchivoEnCache(expediente.nombreArchivo, blob);
            actualizarPdfUrl(URL.createObjectURL(blob));
            return;
          }
        } catch (e) {
          console.warn('Error en fetch de documento estatico Andres Gil Gil:', e);
        }
      }

      // 5. Fallback final solo si no hay documento PDF físico cargado
      if (!cancelado) {
        try {
          const blobGenerado = generarPdfHistoriaClinicaBlob(expediente);
          if (blobGenerado) {
            actualizarPdfUrl(URL.createObjectURL(blobGenerado));
            return;
          }
        } catch (e) {
          console.warn('Error generando PDF de historia clínica:', e);
        }
        actualizarPdfUrl(null);
      }
    }

    resolverPdf();

    return () => {
      cancelado = true;
    };
  }, [expediente?.id, expediente?.codigoCaso, expediente?.nombreArchivo, expediente?.archivoBase64]);

  useEffect(() => {
    return () => {
      if (activeUrlRef.current) {
        URL.revokeObjectURL(activeUrlRef.current);
        activeUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (tabInicial) {
      setTabActiva(tabInicial);
    }
    setVistaModalidad('archivo');
  }, [tabInicial, expediente?.id]);

  if (!expediente) return null;

  const pruebasList = toArray(expediente.datos?.pruebas_diagnosticas_realizadas);
  const tratamientosList = toArray(expediente.datos?.tratamiento_actual);

  const archivoCache = obtenerArchivoDeCache(expediente.nombreArchivo);

  const abrirArchivoOriginal = () => {
    if (!archivoCache) return;
    const url = URL.createObjectURL(archivoCache);
    window.open(url, '_blank');
  };

  const copiarDictamen = () => {
    const texto = `========================================================
DUSAKAWI EPSI - DICTAMEN DE AUDITORÍA CLÍNICA
Enfermedades Huérfanas | MinSalud Colombia (Res. 023 de 2023)
========================================================
Caso: ${expediente.codigoCaso}
Archivo: ${expediente.nombreArchivo}
Fecha de Evaluación: ${expediente.fechaProcesamiento}

DATOS DEL PACIENTE:
- Nombre: ${expediente.datos?.paciente_nombre || expediente.pacienteAnonimizado}
- Identificación: ${expediente.datos?.identificacion_paciente || 'No especificado'}
- Comunidad Indígena ${expediente.comunidadIndigena}
- Sede Territorial: ${expediente.departamentoSede}

DATOS CLÍNICOS:
- Enfermedad: ${expediente.datos?.enfermedad || 'No especificado'}
- Código CIE-10: ${expediente.datos?.codigo_cie10 || 'No especificado'}
- ID Oficial MinSalud: ${expediente.datos?.id_oficial_minsalud || 'No especificado'}
- Especialista: ${expediente.datos?.medico_tratante || 'No especificado'} (${expediente.datos?.especialidad_medico_tratante || 'No especificado'})
- Fecha de Atención: ${expediente.datos?.fecha_diagnostico || 'No especificado'}

CRITERIOS CONFIRMATORIOS Y TRATAMIENTO:
- Pruebas / CUPS: ${pruebasList.length > 0 ? pruebasList.join(' | ') : 'No especificado'}
- Tratamiento: ${tratamientosList.length > 0 ? tratamientosList.join(' | ') : 'No especificado'}

DICTAMEN NORMATIVO:
- Estado: ${expediente.auditoria.estado}
- Indice de Cumplimiento: ${expediente.auditoria.scoreCumplimiento}%
- CUPS Confirmatorio: ${expediente.auditoria.tieneCupsConfirmatorio ? 'CUMPLE' : 'PENDIENTE'}
- Observación: ${expediente.auditoria.observacionAuditoria || 'Conforme a normativa'}
========================================================`;

    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const descargarJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(expediente, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${expediente.codigoCaso}_auditoria_dusakawi.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const estadoBadge = () => {
    if (expediente.auditoria.estado === 'CONFORME') {
      return {
        bg: '#ECFDF5',
        border: '#10B981',
        text: '#065F46',
        label: 'CONFORME MINSALUD',
        icon: <CheckCircle2 size={16} color="#059669" />
      };
    }
    if (expediente.auditoria.estado === 'INCOMPLETO') {
      return {
        bg: '#FFFBEB',
        border: '#F59E0B',
        text: '#92400E',
        label: 'EXPEDIENTE INCOMPLETO',
        icon: <AlertTriangle size={16} color="#D97706" />
      };
    }
    return {
      bg: '#FEF2F2',
      border: '#EF4444',
      text: '#991B1B',
      label: 'ALERTA CRÍTICA',
      icon: <ShieldAlert size={16} color="#DC2626" />
    };
  };

  const badgeInfo = estadoBadge();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 'min(940px, 95vw)' }}>
        
        {/* Cabecera Institucional DUSAKAWI */}
        <div style={{
          padding: '1.25rem 2rem',
          background: 'linear-gradient(135deg, #004D39 0%, #006B54 100%)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          position: 'sticky',
          top: 0,
          zIndex: 20,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <div style={{
              background: 'white',
              padding: '6px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img 
                src={logoImg} 
                alt="DUSAKAWI EPSI" 
                style={{ width: '44px', height: '44px', objectFit: 'contain' }} 
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '4px' }}>
                <span style={{ 
                  background: 'rgba(255, 255, 255, 0.2)', 
                  backdropFilter: 'blur(4px)',
                  color: '#FFFFFF', 
                  fontWeight: 800, 
                  fontSize: '0.78rem', 
                  padding: '2px 10px', 
                  borderRadius: '20px',
                  letterSpacing: '0.05em',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  {expediente.codigoCaso}
                </span>

                <span style={{ 
                  background: badgeInfo.bg, 
                  color: badgeInfo.text, 
                  fontWeight: 700, 
                  fontSize: '0.74rem', 
                  padding: '2px 8px', 
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {badgeInfo.icon}
                  {badgeInfo.label}
                </span>
              </div>

              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                {expediente.datos?.enfermedad || 'Enfermedad sin especificar'}
              </h2>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '6px', fontSize: '0.8rem', color: '#E2E8F0' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <User size={13} color="#A7F3D0" />
                  <strong>{expediente.datos?.paciente_nombre || expediente.pacienteAnonimizado}</strong>
                  <span style={{ background: 'rgba(255,255,255,0.25)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 800, fontFamily: 'monospace' }}>
                    H.C. {((expediente.datos?.numero_historia_clinica || expediente.datos?.identificacion_paciente || '').replace(/\D/g, '') || expediente.codigoCaso)}
                  </span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Building2 size={13} color="#A7F3D0" />
                  <span>{expediente.comunidadIndigena}</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={13} color="#A7F3D0" />
                  <span>{expediente.departamentoSede}</span>
                </span>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            title="Cerrar panel de auditoría"
          >
            <X size={20} />
          </button>
        </div>

        {/* Barra de Navegación Segmentada */}
        <div style={{ 
          padding: '0.75rem 2rem', 
          background: '#F8FAF9', 
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}>
          <button
            type="button"
            onClick={() => setTabActiva('documento')}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: '8px',
              border: '1.5px solid',
              borderColor: tabActiva === 'documento' ? '#006B54' : '#CBD5E1',
              background: tabActiva === 'documento' ? '#006B54' : 'white',
              color: tabActiva === 'documento' ? 'white' : '#0F172A',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s',
              boxShadow: tabActiva === 'documento' ? '0 2px 6px rgba(0, 107, 84, 0.25)' : 'none'
            }}
          >
            <FileText size={16} />
            Documento / Historia Clínica
          </button>

          <button
            type="button"
            onClick={() => setTabActiva('auditoria')}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: tabActiva === 'auditoria' ? '#006B54' : '#E2E8F0',
              background: tabActiva === 'auditoria' ? '#006B54' : 'white',
              color: tabActiva === 'auditoria' ? 'white' : '#475569',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s'
            }}
          >
            <ShieldCheck size={15} />
            Dictamen & Auditoría MinSalud
          </button>

          <button
            type="button"
            onClick={() => setTabActiva('clinica')}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: tabActiva === 'clinica' ? '#006B54' : '#E2E8F0',
              background: tabActiva === 'clinica' ? '#006B54' : 'white',
              color: tabActiva === 'clinica' ? 'white' : '#475569',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s'
            }}
          >
            <Activity size={15} />
            Ficha Clínica & CUPS
          </button>

          <button
            type="button"
            onClick={() => setTabActiva('texto')}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: tabActiva === 'texto' ? '#006B54' : '#E2E8F0',
              background: tabActiva === 'texto' ? '#006B54' : 'white',
              color: tabActiva === 'texto' ? 'white' : '#475569',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s',
              marginLeft: 'auto'
            }}
          >
            <Copy size={15} />
            Texto Extraído
          </button>
        </div>

        {/* Cuerpo Principal del Panel */}
        <div style={{ padding: '1.75rem 2rem', overflowY: 'auto', flex: 1, background: '#FFFFFF' }}>

          {/* TAB 0: DOCUMENTO / HISTORIA CLÍNICA (Visor PDF / Documento Original) */}
          {tabActiva === 'documento' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Barra superior del visor */}
              <div style={{
                background: '#F8FAF9',
                border: '1px solid #CBD5E1',
                borderRadius: '12px',
                padding: '0.9rem 1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: '#005A43', color: 'white', borderRadius: '8px', padding: '6px 8px', display: 'flex', alignItems: 'center' }}>
                    <FileText size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.94rem' }}>
                      {expediente.nombreArchivo}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', gap: '8px', marginTop: '2px' }}>
                      <span>Folio / H.C. {((expediente.datos?.numero_historia_clinica || expediente.datos?.identificacion_paciente || '').replace(/\D/g, '') || expediente.codigoCaso)}</span>
                      <span>•</span>
                      <span>{expediente.tamanoKb || 1} KB</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="application/pdf,.pdf"
                    style={{ display: 'none' }}
                    onChange={handleAdjuntarPdfManual}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-secondary"
                    style={{ 
                      padding: '0.4rem 0.85rem', 
                      fontSize: '0.8rem', 
                      color: '#005A43', 
                      borderColor: '#A7F3D0', 
                      background: '#ECFDF5', 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      fontWeight: 700 
                    }}
                    title="Cargar o cambiar el archivo PDF de esta historia clínica desde tu equipo"
                  >
                    <Upload size={14} /> Adjuntar / Cambiar PDF
                  </button>

                  {pdfUrl && (
                    <a
                      href={pdfUrl}
                      download={expediente.nombreArchivo.toLowerCase().endsWith('.pdf') ? expediente.nombreArchivo : `${expediente.nombreArchivo}.pdf`}
                      className="btn btn-secondary"
                      style={{ 
                        padding: '0.4rem 0.85rem', 
                        fontSize: '0.8rem', 
                        color: '#1E293B', 
                        borderColor: '#CBD5E1', 
                        background: '#FFFFFF', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        fontWeight: 600,
                        textDecoration: 'none'
                      }}
                      title="Descargar este archivo PDF a tu equipo"
                    >
                      <Download size={14} /> Descargar PDF
                    </a>
                  )}

                  {pdfUrl && (
                    <button
                      type="button"
                      onClick={() => window.open(pdfUrl, '_blank')}
                      className="btn btn-secondary"
                      style={{ 
                        padding: '0.4rem 0.85rem', 
                        fontSize: '0.8rem', 
                        color: '#005A43', 
                        borderColor: '#A7F3D0', 
                        background: '#ECFDF5', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        fontWeight: 700 
                      }}
                      title="Abrir el archivo original en una pestaña independiente"
                    >
                      <ExternalLink size={14} /> Abrir PDF Completo
                    </button>
                  )}

                  {pdfUrl && (
                    <div style={{ display: 'inline-flex', background: '#E2E8F0', padding: '2px', borderRadius: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setVistaModalidad('archivo')}
                        style={{
                          padding: '0.3rem 0.65rem',
                          borderRadius: '6px',
                          border: 'none',
                          background: vistaModalidad === 'archivo' ? '#005A43' : 'transparent',
                          color: vistaModalidad === 'archivo' ? '#FFFFFF' : '#475569',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        📄 Archivo PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => setVistaModalidad('historia')}
                        style={{
                          padding: '0.3rem 0.65rem',
                          borderRadius: '6px',
                          border: 'none',
                          background: vistaModalidad === 'historia' ? '#005A43' : 'transparent',
                          color: vistaModalidad === 'historia' ? '#FFFFFF' : '#475569',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        📋 Historia Clínica
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(expediente.textoOriginal || '');
                      setCopiado(true);
                      setTimeout(() => setCopiado(false), 2000);
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    title="Copiar texto de la historia clínica"
                  >
                    {copiado ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                    <span>{copiado ? 'Copiado' : 'Copiar Texto'}</span>
                  </button>
                </div>
              </div>

              {/* Visor PDF Nativo si el usuario subió un PDF y tiene seleccionada la vista de archivo */}
              {pdfUrl && vistaModalidad === 'archivo' ? (
                <div style={{
                  border: '1.5px solid #CBD5E1',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: '#525659',
                  height: '75vh',
                  minHeight: '640px',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.08)'
                }}>
                  <object
                    data={`${pdfUrl}#toolbar=1&navpanes=1`}
                    type="application/pdf"
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  >
                    <iframe
                      src={`${pdfUrl}#toolbar=1`}
                      title={`Visor PDF - ${expediente.nombreArchivo}`}
                      style={{ width: '100%', height: '100%', border: 'none' }}
                    />
                  </object>
                </div>
              ) : (
                /* Vista de Historia Clínica Digitalizada cuando es texto o sesión recargada */
                <div style={{
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '12px',
                  padding: '2rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem'
                }}>
                  <div style={{
                    borderBottom: '2px solid #005A43',
                    paddingBottom: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img src={logoImg} alt="DUSAKAWI" style={{ width: '45px', height: '45px', objectFit: 'contain' }} />
                      <div>
                        <div style={{ fontWeight: 800, color: '#005A43', fontSize: '1.05rem', margin: 0 }}>
                          DUSAKAWI EPSI
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                          Historia Clínica Digitalizada • {expediente.departamentoSede}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#475569' }}>
                      <div><strong>N° Historia Clínica:</strong> {((expediente.datos?.numero_historia_clinica || expediente.datos?.identificacion_paciente || '').replace(/\D/g, '') || expediente.codigoCaso)}</div>
                      <div><strong>Fecha de Atención:</strong> {expediente.datos?.fecha_diagnostico || expediente.fechaProcesamiento}</div>
                    </div>
                  </div>

                  {/* Resumen Clínico del Paciente */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '1rem',
                    background: '#F8FAF9',
                    padding: '1rem',
                    borderRadius: '8px',
                    fontSize: '0.82rem'
                  }}>
                    <div>
                      <span style={{ color: '#64748B', fontWeight: 600 }}>Paciente / Afiliado:</span>
                      <div style={{ fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                        {expediente.datos?.paciente_nombre || expediente.pacienteAnonimizado}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', fontWeight: 600 }}>Médico Tratante:</span>
                      <div style={{ fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                        {expediente.datos?.medico_tratante || 'Especialista'} ({expediente.datos?.especialidad_medico_tratante || 'Medicina Especializada'})
                      </div>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', fontWeight: 600 }}>Diagnóstico Clínico:</span>
                      <div style={{ fontWeight: 800, color: '#005A43', marginTop: '2px' }}>
                        {expediente.datos?.enfermedad} {expediente.datos?.codigo_cie10 ? `(CIE-10: ${expediente.datos.codigo_cie10})` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Texto transcrito completo del expediente */}
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={16} color="#005A43" />
                      <span>Transcripción Médica de la Historia Clínica:</span>
                    </div>

                    <div style={{
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      padding: '1.25rem',
                      fontFamily: 'monospace',
                      fontSize: '0.82rem',
                      color: '#1E293B',
                      lineHeight: 1.65,
                      maxHeight: '520px',
                      overflowY: 'auto',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {expediente.textoOriginal || 'No se cuenta con transcripción textual para este expediente.'}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
          
          {/* TAB 1: AUDITORÍA NORMATIVA */}
          {tabActiva === 'auditoria' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Tarjeta Hero de Conformidad */}
              <div style={{
                background: badgeInfo.bg,
                border: `1px solid ${badgeInfo.border}`,
                borderRadius: '16px',
                padding: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1.5rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '1.15rem', 
                    fontWeight: 800, 
                    color: badgeInfo.text,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <ShieldCheck size={20} />
                    Dictamen Oficial Médico DUSAKAWI EPS
                  </div>

                  <p style={{ margin: '8px 0 0', fontSize: '0.88rem', color: '#334155', lineHeight: 1.5 }}>
                    {expediente.auditoria.observacionAuditoria || 
                     'Expediente clínico analizado bajo la Resolución 023 de 2023 y Ley 1392 de 2010. Todos los soportes documentales fueron auditados bajo estricto principio de Cero Inventiva.'}
                  </p>
                </div>

                <div style={{ 
                  background: 'white', 
                  borderRadius: '14px', 
                  padding: '1rem 1.25rem', 
                  textAlign: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                  border: '1px solid #E2E8F0',
                  minWidth: '130px'
                }}>
                  <div style={{ 
                    fontSize: '2.4rem', 
                    fontWeight: 900, 
                    lineHeight: 1,
                    color: expediente.auditoria.scoreCumplimiento >= 80 ? '#059669' : expediente.auditoria.scoreCumplimiento >= 60 ? '#D97706' : '#DC2626' 
                  }}>
                    {expediente.auditoria.scoreCumplimiento}%
                  </div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', marginTop: '4px', textTransform: 'uppercase' }}>
                    Cumplimiento
                  </div>
                </div>
              </div>

              {/* 4 Pilares de Validación Normativa */}
              <div>
                <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#1E293B', marginBottom: '0.85rem' }}>
                  Pilares de Validación Normativa (Ley 1392 / Resolución 023 de 2023)
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '0.85rem' }}>
                  
                  {/* Pilar 1: CIE-10 */}
                  <div style={{
                    background: '#FAFAFA',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                          1. Codificación CIE-10
                        </span>
                        {(expediente.auditoria.tieneCie10Valido || (expediente.datos?.codigo_cie10 && expediente.datos.codigo_cie10 !== 'No especificado en el documento')) ? (
                          <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', fontWeight: 700 }}>
                            <CheckCircle2 size={15} /> Válido
                          </span>
                        ) : (
                          <span style={{ color: '#DC2626', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', fontWeight: 700 }}>
                            <AlertTriangle size={15} /> Faltante
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#006B54' }}>
                        {expediente.datos?.codigo_cie10 || 'No especificado'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                        Homologado en Censo Nacional MinSalud
                      </div>
                    </div>
                  </div>

                  {/* Pilar 2: CUPS Confirmatorio */}
                  <div style={{
                    background: '#FAFAFA',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                          2. Prueba Gold Standard (CUPS)
                        </span>
                        {expediente.auditoria.tieneCupsConfirmatorio ? (
                          <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', fontWeight: 700 }}>
                            <CheckCircle2 size={15} /> Detectado
                          </span>
                        ) : (
                          <span style={{ color: '#DC2626', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', fontWeight: 700 }}>
                            <AlertTriangle size={15} /> Sin CUPS
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1E293B' }}>
                        {expediente.auditoria.pruebaGoldStandardDetectada || 'No especificado en el documento'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                        Laboratorio o infusión diagnóstica
                      </div>
                    </div>
                  </div>

                  {/* Pilar 3: Especialista */}
                  <div style={{
                    background: '#FAFAFA',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                          3. Especialista Clínico
                        </span>
                        {expediente.auditoria.tieneEspecialista ? (
                          <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', fontWeight: 700 }}>
                            <CheckCircle2 size={15} /> Certificado
                          </span>
                        ) : (
                          <span style={{ color: '#DC2626', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', fontWeight: 700 }}>
                            <AlertTriangle size={15} /> Pendiente
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1E293B' }}>
                        {expediente.datos?.medico_tratante || expediente.auditoria.especialistaDetectado || 'No especificado'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#006B54', fontWeight: 600, marginTop: '2px' }}>
                        {expediente.datos?.especialidad_medico_tratante || 'Especialidad médica'}
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Fortalezas y Alertas Encontradas */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                
                {/* Fortalezas */}
                <div style={{ 
                  background: '#F0FDF4', 
                  border: '1px solid #BBF7D0', 
                  borderRadius: '12px', 
                  padding: '1.25rem' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.75rem' }}>
                    <CheckCircle2 size={18} color="#059669" />
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#065F46', margin: 0 }}>
                      Fortalezas y Hallazgos Normativos ({expediente.auditoria.fortalezas?.length || 0})
                    </h4>
                  </div>
                  
                  {(!expediente.auditoria.fortalezas || expediente.auditoria.fortalezas.length === 0) ? (
                    <p style={{ fontSize: '0.82rem', color: '#047857', margin: 0 }}>
                      No se registraron fortalezas automáticas.
                    </p>
                  ) : (
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {expediente.auditoria.fortalezas.map((f, i) => (
                        <li key={i} style={{ fontSize: '0.82rem', color: '#065F46', lineHeight: 1.4 }}>
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Alertas */}
                <div style={{ 
                  background: (!expediente.auditoria.alertas || expediente.auditoria.alertas.length === 0) ? '#F8FAFC' : '#FEF2F2', 
                  border: `1px solid ${(!expediente.auditoria.alertas || expediente.auditoria.alertas.length === 0) ? '#E2E8F0' : '#FECACA'}`, 
                  borderRadius: '12px', 
                  padding: '1.25rem' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.75rem' }}>
                    <AlertTriangle size={18} color={(!expediente.auditoria.alertas || expediente.auditoria.alertas.length === 0) ? '#64748B' : '#DC2626'} />
                    <h4 style={{ 
                      fontSize: '0.88rem', 
                      fontWeight: 700, 
                      color: (!expediente.auditoria.alertas || expediente.auditoria.alertas.length === 0) ? '#475569' : '#991B1B', 
                      margin: 0 
                    }}>
                      Alertas de Auditoría / Requerimientos ({expediente.auditoria.alertas?.length || 0})
                    </h4>
                  </div>

                  {(!expediente.auditoria.alertas || expediente.auditoria.alertas.length === 0) ? (
                    <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>
                      ✓ Expediente sin alertas críticas. Todos los criterios de aseguramiento están respaldados.
                    </p>
                  ) : (
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {expediente.auditoria.alertas.map((a, i) => (
                        <li key={i} style={{ fontSize: '0.82rem', color: '#991B1B', lineHeight: 1.4 }}>
                          {a}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: FICHA CLÍNICA & CUPS */}
          {tabActiva === 'clinica' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Seccion Diagnóstico Principal */}
              <div style={{
                background: '#F8FAF9',
                border: '1px solid #E2E8F0',
                borderRadius: '14px',
                padding: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                  <Activity size={18} color="#006B54" />
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Diagnóstico Principal & Clasificación Oficial
                  </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                      N° Historia Clínica / Folio
                    </span>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#006B54', marginTop: '2px' }}>
                      {((expediente.datos?.numero_historia_clinica || expediente.datos?.identificacion_paciente || '').replace(/\D/g, '') || expediente.codigoCaso)}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                      Patología Diagnosticada
                    </span>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#006B54', marginTop: '2px' }}>
                      {expediente.datos?.enfermedad || 'No especificado'}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                      Código CIE-10
                    </span>
                    <div style={{ marginTop: '3px' }}>
                      <span style={{ 
                        background: '#006B54', 
                        color: 'white', 
                        fontWeight: 800, 
                        fontSize: '0.85rem', 
                        padding: '3px 10px', 
                        borderRadius: '6px' 
                      }}>
                        {expediente.datos?.codigo_cie10 || 'No especificado'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                      ID Resolución MinSalud
                    </span>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155', marginTop: '4px' }}>
                      {expediente.datos?.id_oficial_minsalud || 'Resolución 023 de 2023'}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                      Grupo / Categoría
                    </span>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginTop: '4px' }}>
                      {expediente.datos?.categoria_grupo || 'Enfermedad Huérfana de Alto Costo'}
                    </div>
                  </div>
                </div>

                {expediente.datos?.criterio_confirmacion && (
                  <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid #E2E8F0', fontSize: '0.84rem' }}>
                    <span style={{ fontWeight: 700, color: '#475569' }}>Criterio de Confirmación Clínica: </span>
                    <span style={{ color: '#1E293B' }}>{expediente.datos.criterio_confirmacion}</span>
                  </div>
                )}
              </div>

              {/* Seccion Equipo Tratante y Atención */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '14px',
                padding: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                  <Stethoscope size={18} color="#006B54" />
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Equipo Tratante & Sede de Atención
                  </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                      Médico Tratante
                    </span>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1E293B', marginTop: '2px' }}>
                      {expediente.datos?.medico_tratante || 'No especificado en el documento'}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                      Especialidad Clínica
                    </span>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#006B54', marginTop: '2px' }}>
                      {expediente.datos?.especialidad_medico_tratante || 'No especificado en el documento'}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                      Fecha de Consulta / Diagnóstico
                    </span>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1E293B', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={14} color="#64748B" />
                      {expediente.datos?.fecha_diagnostico || 'No especificado en el documento'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pruebas Diagnósticas y CUPS */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '14px',
                padding: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                  <ShieldCheck size={18} color="#006B54" />
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Pruebas Diagnósticas & Procedimientos CUPS
                  </h3>
                </div>

                {pruebasList.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>
                    No se especificaron pruebas en el documento.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {pruebasList.map((p, i) => (
                      <div key={i} style={{ 
                        background: '#F1F5F9', 
                        padding: '0.65rem 1rem', 
                        borderRadius: '8px',
                        borderLeft: '4px solid #006B54',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#1E293B'
                      }}>
                        {p}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tratamiento Farmacológico */}
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '14px',
                padding: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
                  <Pill size={18} color="#006B54" />
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Tratamiento Farmacológico Formulado / Manejo Clínico
                  </h3>
                </div>

                {tratamientosList.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>
                    No se especificó tratamiento en el documento.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {tratamientosList.map((t, i) => (
                      <div key={i} style={{ 
                        background: '#ECFDF5', 
                        padding: '0.65rem 1rem', 
                        borderRadius: '8px',
                        borderLeft: '4px solid #10B981',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#065F46'
                      }}>
                        💊 {t}
                      </div>
                    ))}
                  </div>
                )}
              </div>



              {/* Lectura de la Historia Clínica y Documento Fuente */}
              <div style={{
                background: '#F8FAF9',
                border: '1px solid #CBD5E1',
                borderRadius: '14px',
                padding: '1.25rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={18} color="#005A43" />
                    <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      Transcripción y Evidencia de la Historia Clínica
                    </h3>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {archivoCache && (
                      <button
                        type="button"
                        onClick={abrirArchivoOriginal}
                        className="btn btn-secondary"
                        style={{ 
                          padding: '0.35rem 0.75rem', 
                          fontSize: '0.78rem', 
                          color: '#005A43', 
                          borderColor: '#A7F3D0', 
                          background: '#ECFDF5', 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '5px',
                          fontWeight: 700 
                        }}
                        title="Abrir el archivo original subido (PDF)"
                      >
                        <ExternalLink size={14} /> Abrir Archivo Original
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setTabActiva('texto')}
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                    >
                      Pantalla Completa de Texto
                    </button>
                  </div>
                </div>

                <div style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '1rem',
                  fontSize: '0.82rem',
                  color: '#334155',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6,
                  fontFamily: 'inherit'
                }}>
                  {expediente.textoOriginal || 'No se cuenta con texto transcrito para este caso.'}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: TEXTO ORIGINAL EXTRAÍDO */}
          {tabActiva === 'texto' && (
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '0.75rem',
                fontSize: '0.84rem', 
                color: '#64748B' 
              }}>
                <span>
                  Texto original extraído del documento: <strong>{expediente.nombreArchivo}</strong>
                </span>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(expediente.textoOriginal || '');
                    setCopiado(true);
                    setTimeout(() => setCopiado(false), 2000);
                  }}
                  style={{
                    background: '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {copiado ? <Check size={13} color="#059669" /> : <Copy size={13} />}
                  {copiado ? '¡Copiado!' : 'Copiar Texto Completo'}
                </button>
              </div>

              <pre style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                padding: '1.25rem',
                borderRadius: '12px',
                fontFamily: 'monospace',
                fontSize: '0.82rem',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6,
                maxHeight: '520px',
                overflowY: 'auto',
                color: '#1E293B'
              }}>
                {expediente.textoOriginal || 'No hay contenido textual disponible.'}
              </pre>
            </div>
          )}

        </div>

        {/* Pie de Acciones del Auditor */}
        <div style={{
          padding: '1rem 2rem',
          background: '#F8FAF9',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          bottom: 0,
          zIndex: 20
        }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={copiarDictamen}
              style={{
                background: copiado ? '#059669' : '#006B54',
                color: 'white',
                border: 'none',
                padding: '0.55rem 1.1rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
                boxShadow: '0 2px 6px rgba(0, 107, 84, 0.25)'
              }}
            >
              {copiado ? <Check size={16} /> : <Copy size={16} />}
              {copiado ? '¡Dictamen ¡Copiado!' : 'Copiar Dictamen de Auditoría'}
            </button>

            <button
              onClick={descargarJson}
              style={{
                background: 'white',
                color: '#475569',
                border: '1px solid #CBD5E1',
                padding: '0.55rem 0.95rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s'
              }}
            >
              <Download size={15} />
              Exportar JSON
            </button>
          </div>

          <button
            onClick={onClose}
            style={{
              background: '#E2E8F0',
              color: '#334155',
              border: 'none',
              padding: '0.55rem 1.25rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            Cerrar Expediente
          </button>
        </div>

      </div>
    </div>
  );
};
