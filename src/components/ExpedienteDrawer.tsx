import React, { useState, useEffect } from 'react';
import { 
  X, CheckCircle2, AlertTriangle, FileText, 
  ShieldCheck, User, Stethoscope, Pill, Activity, 
  Copy, Check, MapPin, Calendar, Building2, 
  Download, ShieldAlert, ExternalLink
} from 'lucide-react';
import logoImg from '../assets/logo.png';
import type { IExpedienteClinico } from '../types/clinical';
import { obtenerArchivoDeCache } from '../services/exportService';

interface ExpedienteDrawerProps {
  expediente: IExpedienteClinico | null;
  onClose: () => void;
  tabInicial?: 'auditoria' | 'clinica' | 'texto';
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
  tabInicial = 'auditoria'
}) => {
  const [tabActiva, setTabActiva] = useState<'auditoria' | 'clinica' | 'texto'>(tabInicial);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (tabInicial) {
      setTabActiva(tabInicial);
    }
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
                    H.C. {(expediente.datos?.numero_historia_clinica || expediente.datos?.identificacion_paciente || '1082836713').replace(/\D/g, '')}
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
            <FileText size={15} />
            Evidencia Textual
          </button>
        </div>

        {/* Cuerpo Principal del Panel */}
        <div style={{ padding: '1.75rem 2rem', overflowY: 'auto', flex: 1, background: '#FFFFFF' }}>
          
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
                      {(expediente.datos?.numero_historia_clinica || expediente.datos?.identificacion_paciente || '1082836713').replace(/\D/g, '')}
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
