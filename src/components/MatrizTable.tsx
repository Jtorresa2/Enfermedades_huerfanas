import React, { useState } from 'react';
import { 
  Search, Trash2, CheckCircle, AlertTriangle, XCircle, 
  MapPin, UploadCloud, X, RotateCcw, FolderArchive, FileSpreadsheet,
  FileText 
} from 'lucide-react';
import { exportarLoteOrganizadoZip, exportarMatrizExcel } from '../services/exportService';
import type { IExpedienteClinico, NivelConformidad } from '../types/clinical';

interface MatrizTableProps {
  expedientes: IExpedienteClinico[];
  onSeleccionarExpediente: (expediente: IExpedienteClinico, tabInicial?: 'documento' | 'auditoria' | 'clinica' | 'texto') => void;
  onEliminarExpediente: (id: string) => void;
  onCargarNuevos?: () => void;
}

export const MatrizTable: React.FC<MatrizTableProps> = ({
  expedientes,
  onSeleccionarExpediente,
  onEliminarExpediente,
  onCargarNuevos
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [filtroSede, setFiltroSede] = useState<string>('TODAS');
  const [expedienteAEliminar, setExpedienteAEliminar] = useState<IExpedienteClinico | null>(null);

  const conformesCount = expedientes.filter(e => e.auditoria.estado === 'CONFORME').length;
  const incompletosCount = expedientes.filter(e => e.auditoria.estado === 'INCOMPLETO').length;
  const criticosCount = expedientes.filter(e => e.auditoria.estado === 'CRITICO').length;

  const expedientesFiltrados = expedientes.filter(exp => {
    const coincideTexto = 
      exp.codigoCaso.toLowerCase().includes(busqueda.toLowerCase()) ||
      ((exp.datos?.numero_historia_clinica || '').toLowerCase().includes(busqueda.toLowerCase())) ||
      exp.datos.enfermedad.toLowerCase().includes(busqueda.toLowerCase()) ||
      exp.datos.codigo_cie10.toLowerCase().includes(busqueda.toLowerCase()) ||
      exp.pacienteAnonimizado.toLowerCase().includes(busqueda.toLowerCase()) ||
      exp.comunidadIndigena.toLowerCase().includes(busqueda.toLowerCase()) ||
      (exp.auditoria.especialistaDetectado || '').toLowerCase().includes(busqueda.toLowerCase());

    const coincideEstado = filtroEstado === 'TODOS' || exp.auditoria.estado === filtroEstado;
    const coincideSede = filtroSede === 'TODAS' || exp.departamentoSede === filtroSede;

    return coincideTexto && coincideEstado && coincideSede;
  });

  const hayFiltrosActivos = busqueda.trim() !== '' || filtroEstado !== 'TODOS' || filtroSede !== 'TODAS';

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroEstado('TODOS');
    setFiltroSede('TODAS');
  };

  const getStatusBadge = (estado: NivelConformidad) => {
    switch (estado) {
      case 'CONFORME':
        return (
          <span className="status-badge CONFORME">
            <CheckCircle size={14} /> CONFORME
          </span>
        );
      case 'INCOMPLETO':
        return (
          <span className="status-badge INCOMPLETO">
            <AlertTriangle size={14} /> INCOMPLETO
          </span>
        );
      case 'CRITICO':
        return (
          <span className="status-badge CRITICO">
            <XCircle size={14} /> CRÍTICO
          </span>
        );
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#059669';
    if (score >= 70) return '#D97706';
    return '#DC2626';
  };

  return (
    <div className="table-section">
      {/* Barra de Filtros y Control Organizada */}
      <div style={{
        background: 'white',
        border: '1px solid var(--border-color)',
        borderRadius: '14px',
        padding: '1.1rem 1.25rem',
        marginBottom: '1.25rem',
        boxShadow: '0 2px 6px -1px rgba(0, 0, 0, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem'
      }}>
        {/* Fila 1: Búsqueda y Botón Principal */}
        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 320px' }}>
            <Search 
              size={17} 
              style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} 
            />
            <input
              type="text"
              placeholder="Buscar por código, enfermedad, CIE-10, paciente, comunidad o médico tratante..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 2.2rem 0.65rem 2.4rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.88rem',
                outline: 'none',
                transition: 'border-color 0.2s',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-dusakawi)'}
              onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94A3B8',
                  padding: 0
                }}
                title="Borrar búsqueda"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary"
              onClick={() => exportarLoteOrganizadoZip(expedientesFiltrados)}
              style={{ 
                whiteSpace: 'nowrap',
                background: '#F0FDF4',
                borderColor: '#BBF7D0',
                color: '#006B54',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Descargar paquete con carpeta inicial y subcarpetas por paciente"
            >
              <FolderArchive size={16} />
              <span>Descargar Lote en Carpetas (.ZIP)</span>
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => exportarMatrizExcel(expedientesFiltrados)}
              style={{ 
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Descargar matriz en Excel"
            >
              <FileSpreadsheet size={16} />
              <span>Exportar Excel</span>
            </button>

            {onCargarNuevos && (
              <button
                className="btn btn-primary"
                onClick={onCargarNuevos}
                style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <UploadCloud size={16} />
                <span>Cargar Expedientes PDF</span>
              </button>
            )}
          </div>
        </div>

        {/* Fila 2: Filtros por Estado (Pills), Filtro por Sede y Contador */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '0.75rem',
          paddingTop: '0.65rem',
          borderTop: '1px solid #F1F5F9'
        }}>
          {/* Pills de Estado */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', marginRight: '4px', textTransform: 'uppercase' }}>
              Estado:
            </span>

            <button
              onClick={() => setFiltroEstado('TODOS')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: filtroEstado === 'TODOS' ? '#005A43' : '#E2E8F0',
                background: filtroEstado === 'TODOS' ? '#005A43' : '#F8FAFC',
                color: filtroEstado === 'TODOS' ? 'white' : '#475569',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              Todos ({expedientes.length})
            </button>

            <button
              onClick={() => setFiltroEstado('CONFORME')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: filtroEstado === 'CONFORME' ? '#059669' : '#E2E8F0',
                background: filtroEstado === 'CONFORME' ? '#ECFDF5' : '#F8FAFC',
                color: filtroEstado === 'CONFORME' ? '#065F46' : '#475569',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <span style={{ color: '#059669', marginRight: '4px' }}>●</span>
              Conformes ({conformesCount})
            </button>

            <button
              onClick={() => setFiltroEstado('INCOMPLETO')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: filtroEstado === 'INCOMPLETO' ? '#D97706' : '#E2E8F0',
                background: filtroEstado === 'INCOMPLETO' ? '#FFFBEB' : '#F8FAFC',
                color: filtroEstado === 'INCOMPLETO' ? '#92400E' : '#475569',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <span style={{ color: '#D97706', marginRight: '4px' }}>●</span>
              Incompletos ({incompletosCount})
            </button>

            <button
              onClick={() => setFiltroEstado('CRITICO')}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: filtroEstado === 'CRITICO' ? '#DC2626' : '#E2E8F0',
                background: filtroEstado === 'CRITICO' ? '#FEF2F2' : '#F8FAFC',
                color: filtroEstado === 'CRITICO' ? '#991B1B' : '#475569',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <span style={{ color: '#DC2626', marginRight: '4px' }}>●</span>
              Críticos ({criticosCount})
            </button>
          </div>

          {/* Sede y Contador */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MapPin size={15} color="#64748B" />
              <select
                value={filtroSede}
                onChange={(e) => setFiltroSede(e.target.value)}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  background: 'white',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  color: '#334155',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="TODAS">Todas las Sedes</option>
                <option value="Cesar">Sede Cesar</option>
                <option value="La Guajira">Sede La Guajira</option>
                <option value="Magdalena">Sede Magdalena</option>
              </select>
            </div>

            {hayFiltrosActivos && (
              <button
                onClick={limpiarFiltros}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '0.38rem 0.65rem',
                  borderRadius: '8px',
                  border: '1px dashed #CBD5E1',
                  background: 'white',
                  color: '#64748B',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                title="Restablecer filtros"
              >
                <RotateCcw size={12} />
                <span>Limpiar</span>
              </button>
            )}

            <span style={{ fontSize: '0.82rem', color: '#64748B', marginLeft: '4px' }}>
              <strong>{expedientesFiltrados.length}</strong> de {expedientes.length} expedientes
            </span>
          </div>
        </div>
      </div>

      {/* Tabla Clínica */}
      <div className="table-card">
        <div className="table-responsive">
          <table className="clinical-table">
            <thead>
              <tr>
                <th>Código / Expediente</th>
                <th>N° Historia Clínica</th>
                <th>Afiliado & Comunidad Indígena</th>
                <th>Sede</th>
                <th>Enfermedad (MinSalud)</th>
                <th>CIE-10</th>
                <th>Prueba Gold Standard (CUPS)</th>
                <th>Especialista Tratante</th>
                <th>Auditoría</th>
                <th>% Cumplimiento</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {expedientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No se encontraron expedientes con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                expedientesFiltrados.map((exp) => (
                  <tr key={exp.id}>
                    {/* Código / Expediente */}
                    <td>
                      <div 
                        className="caso-link" 
                        onClick={() => onSeleccionarExpediente(exp, 'auditoria')}
                      >
                        {exp.codigoCaso}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {exp.nombreArchivo}
                      </div>
                    </td>

                    {/* N° Historia Clínica (Columna Independiente) */}
                    <td>
                      <div style={{ 
                        fontWeight: 800, 
                        color: '#005A43', 
                        fontSize: '0.9rem',
                        fontFamily: 'monospace',
                        background: '#E6F4EA',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        display: 'inline-block',
                        border: '1px solid #CEEAD6',
                        letterSpacing: '0.02em'
                      }}>
                        {(exp.datos?.numero_historia_clinica || exp.datos?.identificacion_paciente || '1082836713').replace(/\D/g, '')}
                      </div>
                    </td>

                    {/* Afiliado & Comunidad Indígena */}
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.86rem' }}>
                        {exp.datos?.paciente_nombre && exp.datos.paciente_nombre !== 'No especificado en el documento'
                          ? exp.datos.paciente_nombre
                          : exp.pacienteAnonimizado}
                      </div>
                      
                      <div style={{ fontSize: '0.74rem', color: '#047857', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <span>🏛️</span> {exp.comunidadIndigena}
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem' }}>
                        <MapPin size={14} color="#64748B" />
                        <span>{exp.departamentoSede}</span>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {exp.datos.enfermedad}
                      </div>
                      {exp.datos.id_oficial_minsalud && exp.datos.id_oficial_minsalud !== 'No especificado en el documento' ? (
                        <div style={{ marginTop: '3px' }}>
                          <span style={{ 
                            background: '#E6F4EA', 
                            color: '#005A43', 
                            padding: '1px 6px', 
                            borderRadius: '4px', 
                            fontSize: '0.7rem', 
                            fontWeight: 600,
                            display: 'inline-block',
                            border: '1px solid #CEEAD6'
                          }}>
                            {exp.datos.id_oficial_minsalud}
                          </span>
                        </div>
                      ) : null}
                    </td>

                    <td>
                      <span className="badge-cie10">
                        {exp.datos.codigo_cie10}
                      </span>
                    </td>

                    <td>
                      {exp.auditoria.tieneCupsConfirmatorio ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span className="badge-cups">
                            {exp.auditoria.pruebaGoldStandardDetectada}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 600 }}>
                          ⚠️ Sin CUPS
                        </span>
                      )}
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#005A43' }}>
                        {exp.datos?.especialidad_medico_tratante && exp.datos.especialidad_medico_tratante !== 'No especificado en el documento'
                          ? exp.datos.especialidad_medico_tratante
                          : (exp.auditoria.especialistaDetectado || 'Especialista')}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                        {exp.datos?.medico_tratante && exp.datos.medico_tratante !== 'No especificado en el documento'
                          ? exp.datos.medico_tratante
                          : 'Médico Tratante'}
                      </div>
                    </td>

                    <td>
                      {getStatusBadge(exp.auditoria.estado)}
                    </td>

                    <td>
                      <div className="score-cell">
                        <div className="progress-bar-bg">
                          <div 
                            className="progress-bar-fill"
                            style={{ 
                              width: `${exp.auditoria.scoreCumplimiento}%`,
                              backgroundColor: getScoreColor(exp.auditoria.scoreCumplimiento)
                            }}
                          />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.78rem', color: getScoreColor(exp.auditoria.scoreCumplimiento) }}>
                          {exp.auditoria.scoreCumplimiento}%
                        </span>
                      </div>
                    </td>

                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.45rem' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ 
                            padding: '0.38rem 0.75rem', 
                            fontSize: '0.78rem', 
                            color: '#005A43', 
                            borderColor: '#A7F3D0', 
                            background: '#F0FDF8',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontWeight: 600
                          }}
                          onClick={() => onSeleccionarExpediente(exp, 'documento')}
                          title="Ver documento original e historia clínica completa"
                        >
                          <FileText size={14} color="#005A43" /> Historia Clínica
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ 
                            padding: '0.38rem 0.55rem', 
                            color: '#DC2626',
                            borderColor: '#FECACA',
                            background: '#FEF2F2',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '8px'
                          }}
                          onClick={() => setExpedienteAEliminar(exp)}
                          title="Eliminar de la sesión actual"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
                    </table>
        </div>
      </div>

      {/* Modal de Confirmación de Eliminación */}
      {expedienteAEliminar && (
        <div 
          className="modal-overlay" 
          onClick={() => setExpedienteAEliminar(null)}
          style={{ 
            zIndex: 120, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: 'rgba(1, 35, 25, 0.7)'
          }}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '460px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
              textAlign: 'center',
              animation: 'fadeInModal 0.2s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#FEE2E2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <AlertTriangle size={28} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>
              ¿Estás seguro de eliminar esta historia clínica?
            </h3>

            <p style={{ fontSize: '0.88rem', color: '#64748B', lineHeight: 1.5, marginBottom: '1.75rem' }}>
              Se eliminará permanentemente el expediente de <strong>{expedienteAEliminar.pacienteAnonimizado}</strong> ({expedienteAEliminar.codigoCaso}) de la matriz de auditoría.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setExpedienteAEliminar(null)}
                style={{ padding: '0.65rem 1.35rem', fontSize: '0.86rem', fontWeight: 600 }}
              >
                Cancelar
              </button>

              <button
                style={{
                  background: '#DC2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.65rem 1.35rem',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)'
                }}
                onClick={() => {
                  onEliminarExpediente(expedienteAEliminar.id);
                  setExpedienteAEliminar(null);
                }}
              >
                <Trash2 size={15} />
                Sí, Eliminar Historia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
