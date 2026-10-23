import React, { useState } from 'react';
import { 
  Search, Trash2, AlertTriangle, XCircle, 
  MapPin, UploadCloud, X, RotateCcw, FolderArchive, FileSpreadsheet,
  FileText, CheckCircle2, ShieldAlert, Layers
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
  const totalCasos = expedientes.length;
  const porcentajeConformidad = totalCasos > 0 ? Math.round((conformesCount / totalCasos) * 100) : 0;

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
            <CheckCircle2 size={13} /> CONFORME
          </span>
        );
      case 'INCOMPLETO':
        return (
          <span className="status-badge INCOMPLETO">
            <AlertTriangle size={13} /> INCOMPLETO
          </span>
        );
      case 'CRITICO':
        return (
          <span className="status-badge CRITICO">
            <XCircle size={13} /> CRÍTICO
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
      {/* ====================================================================
          TARJETAS KPI EJECUTIVAS (MÉTRICAS CLÍNICAS EN TIEMPO REAL)
          ==================================================================== */}
      <div className="kpi-dashboard-grid">
        {/* KPI 1: Total Expedientes */}
        <div 
          className={`kpi-card ${filtroEstado === 'TODOS' ? 'active-filter' : ''}`}
          onClick={() => setFiltroEstado('TODOS')}
          title="Click para ver todos los expedientes"
        >
          <div className="kpi-card-header">
            <span className="kpi-label">Total Expedientes</span>
            <div className="kpi-icon-badge kpi-icon-primary">
              <Layers size={18} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value">{totalCasos}</span>
            <span className="kpi-badge neutral">100% cargados</span>
          </div>
          <div className="kpi-subtext">
            <span>Auditoría DUSAKAWI EPSI</span>
            {filtroEstado === 'TODOS' && <span className="kpi-active-indicator">● Activo</span>}
          </div>
        </div>

        {/* KPI 2: Conformes MinSalud */}
        <div 
          className={`kpi-card ${filtroEstado === 'CONFORME' ? 'active-filter' : ''}`}
          onClick={() => setFiltroEstado('CONFORME')}
          title="Click para filtrar únicamente casos Conformes"
        >
          <div className="kpi-card-header">
            <span className="kpi-label">Conformes MinSalud</span>
            <div className="kpi-icon-badge kpi-icon-success">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value kpi-success">{conformesCount}</span>
            <span className="kpi-badge success">{porcentajeConformidad}% cumplimiento</span>
          </div>
          <div className="kpi-progress-bar">
            <div 
              className="kpi-progress-fill success" 
              style={{ width: `${porcentajeConformidad}%` }} 
            />
          </div>
          <div className="kpi-subtext">
            <span>Cumplen Gold Standard & Especialidad</span>
            {filtroEstado === 'CONFORME' && <span className="kpi-active-indicator">● Activo</span>}
          </div>
        </div>

        {/* KPI 3: Incompletos / Requieren Soporte */}
        <div 
          className={`kpi-card ${filtroEstado === 'INCOMPLETO' ? 'active-filter' : ''}`}
          onClick={() => setFiltroEstado('INCOMPLETO')}
          title="Click para filtrar expedientes Incompletos"
        >
          <div className="kpi-card-header">
            <span className="kpi-label">Incompletos / Pendientes</span>
            <div className="kpi-icon-badge kpi-icon-warning">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value kpi-warning">{incompletosCount}</span>
            <span className="kpi-badge warning">Requiere Soporte</span>
          </div>
          <div className="kpi-subtext">
            <span>Falta CUPS confirmatorio o médico</span>
            {filtroEstado === 'INCOMPLETO' && <span className="kpi-active-indicator">● Activo</span>}
          </div>
        </div>

        {/* KPI 4: Casos Críticos / SIVIGILA */}
        <div 
          className={`kpi-card ${filtroEstado === 'CRITICO' ? 'active-filter' : ''}`}
          onClick={() => setFiltroEstado('CRITICO')}
          title="Click para filtrar alertas críticas"
        >
          <div className="kpi-card-header">
            <span className="kpi-label">Alertas Críticas</span>
            <div className="kpi-icon-badge kpi-icon-danger">
              <ShieldAlert size={18} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-value kpi-danger">{criticosCount}</span>
            <span className="kpi-badge danger">Prioridad SIVIGILA</span>
          </div>
          <div className="kpi-subtext">
            <span>Revisión en Mesa Técnica DUSAKAWI</span>
            {filtroEstado === 'CRITICO' && <span className="kpi-active-indicator">● Activo</span>}
          </div>
        </div>
      </div>

      {/* ====================================================================
          BARRA DE CONTROL, FILTROS Y ACCIONES EXECUTIVAS
          ==================================================================== */}
      <div className="controls-panel-card">
        {/* Fila 1: Búsqueda y Botones de Acción */}
        <div className="controls-row-primary">
          <div className="search-input-wrapper">
            <Search size={18} className="search-input-icon" />
            <input
              type="text"
              placeholder="Buscar por código, N° historia, paciente, CIE-10, enfermedad o especialista..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="search-input-field"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="search-clear-btn"
                title="Limpiar búsqueda"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="controls-actions-group">
            <button
              type="button"
              className="btn btn-export-zip"
              onClick={() => exportarLoteOrganizadoZip(expedientesFiltrados)}
              title="Descargar paquete con carpeta inicial y subcarpetas por paciente"
            >
              <FolderArchive size={16} />
              <span>Descargar Lote en Carpetas (.ZIP)</span>
            </button>

            <button
              type="button"
              className="btn btn-export-excel"
              onClick={() => exportarMatrizExcel(expedientesFiltrados)}
              title="Descargar matriz consolidada en Excel"
            >
              <FileSpreadsheet size={16} />
              <span>Exportar Excel</span>
            </button>

            {onCargarNuevos && (
              <button
                type="button"
                className="btn btn-primary-cta"
                onClick={onCargarNuevos}
                title="Subir nuevas historias clínicas en PDF para extracción automática"
              >
                <UploadCloud size={16} />
                <span>Cargar Expedientes PDF</span>
              </button>
            )}
          </div>
        </div>

        {/* Fila 2: Segmented Pills de Estado, Selector de Sede y Conteo */}
        <div className="controls-row-secondary">
          {/* Pills de Estado con contadores */}
          <div className="status-pills-cluster">
            <span className="filter-cluster-label">Filtrar por:</span>

            <button
              type="button"
              onClick={() => setFiltroEstado('TODOS')}
              className={`filter-pill ${filtroEstado === 'TODOS' ? 'active' : ''}`}
            >
              Todos <span className="pill-badge">{expedientes.length}</span>
            </button>

            <button
              type="button"
              onClick={() => setFiltroEstado('CONFORME')}
              className={`filter-pill pill-conforme ${filtroEstado === 'CONFORME' ? 'active' : ''}`}
            >
              <span className="dot dot-success" />
              Conformes <span className="pill-badge">{conformesCount}</span>
            </button>

            <button
              type="button"
              onClick={() => setFiltroEstado('INCOMPLETO')}
              className={`filter-pill pill-incompleto ${filtroEstado === 'INCOMPLETO' ? 'active' : ''}`}
            >
              <span className="dot dot-warning" />
              Incompletos <span className="pill-badge">{incompletosCount}</span>
            </button>

            <button
              type="button"
              onClick={() => setFiltroEstado('CRITICO')}
              className={`filter-pill pill-critico ${filtroEstado === 'CRITICO' ? 'active' : ''}`}
            >
              <span className="dot dot-danger" />
              Críticos <span className="pill-badge">{criticosCount}</span>
            </button>
          </div>

          {/* Sede y Contador */}
          <div className="location-filter-cluster">
            <div className="select-sede-wrapper">
              <MapPin size={15} className="select-sede-icon" />
              <select
                value={filtroSede}
                onChange={(e) => setFiltroSede(e.target.value)}
                className="select-sede-dropdown"
              >
                <option value="TODAS">Todas las Sedes</option>
                <option value="Cesar">Sede Cesar</option>
                <option value="La Guajira">Sede La Guajira</option>
                <option value="Magdalena">Sede Magdalena</option>
              </select>
            </div>

            {hayFiltrosActivos && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="btn-clear-filters"
                title="Restablecer todos los filtros"
              >
                <RotateCcw size={13} />
                <span>Limpiar filtros</span>
              </button>
            )}

            <div className="results-counter-chip">
              <strong>{expedientesFiltrados.length}</strong> de {expedientes.length} expedientes
            </div>
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
                        onClick={() => onSeleccionarExpediente(exp, 'documento')}
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
                        {((exp.datos?.numero_historia_clinica || exp.datos?.identificacion_paciente || '').replace(/\D/g, '') || exp.codigoCaso)}
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
