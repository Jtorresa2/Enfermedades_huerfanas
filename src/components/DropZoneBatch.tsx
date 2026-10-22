import { registrarArchivoEnCache } from '../services/exportService';
import React, { useState, useRef } from 'react';
import { 
  UploadCloud, FolderUp, Sparkles, Loader2, FileText, FileArchive, 
  CheckCircle2, Table 
} from 'lucide-react';
import JSZip from 'jszip';
import type { IExpedienteClinico } from '../types/clinical';
import { procesarDocumentoArchivo } from '../services/extractionEngine';
import { CASOS_INICIALES } from '../data/casosEjemplo';

interface DropZoneBatchProps {
  onExpedientesProcesados: (nuevos: IExpedienteClinico[], navegarAMatriz?: boolean) => void;
  geminiApiKey?: string;
  apiKey?: string;
  onOpenConfig?: () => void;
  onVerExpediente?: (expediente: IExpedienteClinico, tabInicial?: 'documento' | 'auditoria' | 'clinica' | 'texto') => void;
  onIrAMatriz?: () => void;
}

export const DropZoneBatch: React.FC<DropZoneBatchProps> = ({
  onExpedientesProcesados,
  geminiApiKey,
  apiKey,
  onVerExpediente,
  onIrAMatriz
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [progresoTexto, setProgresoTexto] = useState('Analizando historia clínica...');
  const [progresoPorcentaje, setProgresoPorcentaje] = useState(15);
  const [archivoActualNombre, setArchivoActualNombre] = useState('');
  const [completadoReciente, setCompletadoReciente] = useState<IExpedienteClinico[] | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  // Clave de API activa de Gemini
  const activeKey = 
    (apiKey && apiKey.trim().length > 10 ? apiKey.trim() : null) ||
    (geminiApiKey && geminiApiKey.trim().length > 10 ? geminiApiKey.trim() : null) ||
    localStorage.getItem('dusakawi_gemini_api_key') ||
    (import.meta.env.VITE_GEMINI_API_KEY || '');

  // Función recursiva / extractora para descomprimir .ZIP y extraer archivos soportados
  const extraerArchivosDeZip = async (archivoZip: File): Promise<File[]> => {
    const zip = await JSZip.loadAsync(archivoZip);
    const extraidos: File[] = [];

    const entradas = Object.entries(zip.files);
    for (const [rutaRelativa, zipEntry] of entradas) {
      if (zipEntry.dir) continue;
      // Descartar archivos del sistema operativo o temporales
      if (
        rutaRelativa.includes('__MACOSX') || 
        rutaRelativa.startsWith('.') || 
        rutaRelativa.includes('/.') ||
        rutaRelativa.endsWith('.DS_Store')
      ) {
        continue;
      }

      const extension = rutaRelativa.split('.').pop()?.toLowerCase() || '';
      if (['pdf', 'docx', 'doc', 'txt'].includes(extension)) {
        const blob = await zipEntry.async('blob');
        const nombreArchivo = rutaRelativa.split('/').pop() || rutaRelativa;
        
        let tipoMime = 'application/octet-stream';
        if (extension === 'pdf') tipoMime = 'application/pdf';
        else if (extension === 'txt') tipoMime = 'text/plain';
        else if (extension === 'docx') tipoMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else if (extension === 'doc') tipoMime = 'application/msword';

        const file = new File([blob], nombreArchivo, { type: tipoMime });
        extraidos.push(file);
      }
    }

    return extraidos;
  };

  const manejarArchivos = async (archivosRecibidos: FileList | null) => {
    if (!archivosRecibidos || archivosRecibidos.length === 0) return;

    setProcesando(true);
    setProgresoPorcentaje(5);
    setProgresoTexto('Examinando archivos cargados...');

    // 1. Desempaquetar si hay archivos .zip
    const listaFinalArchivos: File[] = [];

    for (let i = 0; i < archivosRecibidos.length; i++) {
      const archivo = archivosRecibidos[i];
      const esZip = archivo.name.toLowerCase().endsWith('.zip') || archivo.type.includes('zip');

      if (esZip) {
        setProgresoTexto(`Descomprimiendo lote .ZIP: ${archivo.name}...`);
        setProgresoPorcentaje(10);
        try {
          const archivosEnZip = await extraerArchivosDeZip(archivo);
          listaFinalArchivos.push(...archivosEnZip);
        } catch (zipError) {
          console.error(`Error al descomprimir ${archivo.name}:`, zipError);
        }
      } else {
        const ext = archivo.name.split('.').pop()?.toLowerCase() || '';
        if (['pdf', 'docx', 'doc', 'txt'].includes(ext)) {
          listaFinalArchivos.push(archivo);
        }
      }
    }

    if (listaFinalArchivos.length === 0) {
      setProgresoTexto('No se encontraron documentos PDF o clínicos en el archivo cargado.');
      setTimeout(() => setProcesando(false), 2000);
      return;
    }

    // 2. Procesar la lista de documentos en lote
    const total = listaFinalArchivos.length;
    const nuevosExpedientes: IExpedienteClinico[] = [];

    for (let i = 0; i < total; i++) {
      const doc = listaFinalArchivos[i];
      registrarArchivoEnCache(doc.name, doc);
      setArchivoActualNombre(doc.name);

      const basePct = Math.round((i / total) * 100);
      setProgresoPorcentaje(Math.max(15, basePct));
      setProgresoTexto(`Procesando historia clínica (${i + 1} de ${total}): ${doc.name}...`);

      try {
        const expediente = await procesarDocumentoArchivo(
          doc, 
          activeKey,
          (pctParcial, msg) => {
            const pctGlobal = Math.round(basePct + (pctParcial / total));
            setProgresoPorcentaje(Math.min(99, pctGlobal));
            setProgresoTexto(`[${i + 1}/${total}] ${msg}`);
          }
        );
        nuevosExpedientes.push(expediente);
      } catch (err) {
        console.error(`Error procesando archivo ${doc.name}:`, err);
      }
    }

    setProgresoPorcentaje(100);
    setProgresoTexto(`¡Auditoría completada! ${nuevosExpedientes.length} ${nuevosExpedientes.length === 1 ? 'historia registrada' : 'historias registradas'}.`);
    
    // Guardar los expedientes en el estado global y navegar a la matriz de inmediato
    onExpedientesProcesados(nuevosExpedientes, true);

    setTimeout(() => {
      setProcesando(false);
      setProgresoTexto('');
      setProgresoPorcentaje(0);
      setArchivoActualNombre('');
      setCompletadoReciente(nuevosExpedientes);
    }, 400);
  };

  const cargarCasoDemo = (casoIndex: number) => {
    const demo = CASOS_INICIALES[casoIndex];
    if (demo) {
      const nuevo: IExpedienteClinico = {
        ...demo,
        codigoCaso: `DEMO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        fechaProcesamiento: new Date().toISOString()
      };
      onExpedientesProcesados([nuevo], false);
      setCompletadoReciente([nuevo]);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Modal flotante de procesamiento */}
      {procesando && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(8px)',
          borderRadius: '16px',
          zIndex: 40,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2.5rem',
          textAlign: 'center',
          border: '2px solid rgba(0, 90, 67, 0.25)',
          boxShadow: '0 20px 40px rgba(0, 90, 67, 0.15)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: '#005A43',
            color: 'white',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem',
            boxShadow: '0 0 0 8px rgba(0, 90, 67, 0.12)'
          }}>
            <Loader2 size={32} className="animate-spin" />
          </div>

          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#005A43', margin: '0 0 0.35rem 0' }}>
            Extracción y Auditoría Clínica en Lote
          </h3>

          <p style={{ fontSize: '0.9rem', color: '#475569', margin: '0 0 1.5rem 0', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <FileText size={16} color="#005A43" />
            <span>Documento actual: <strong>{archivoActualNombre || 'Expediente clínico'}</strong></span>
          </p>

          {/* Barra de Progreso Grande */}
          <div style={{ width: '100%', maxWidth: '520px', margin: '0 auto 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: '#005A43' }}>
              <span>{progresoTexto}</span>
              <span style={{ fontSize: '0.92rem' }}>{progresoPorcentaje}%</span>
            </div>
            <div style={{ width: '100%', height: '14px', background: '#E2E8F0', borderRadius: '10px', overflow: 'hidden', padding: '2px' }}>
              <div 
                style={{
                  width: `${progresoPorcentaje}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #005A43 0%, #10B981 100%)',
                  borderRadius: '8px',
                  transition: 'width 0.35s ease'
                }}
              />
            </div>
          </div>

          {/* Hitos del workflow clínico */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1.25rem',
            flexWrap: 'wrap',
            marginTop: '1.25rem',
            fontSize: '0.82rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid rgba(0, 90, 67, 0.1)'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: progresoPorcentaje >= 20 ? '#047857' : '#94A3B8', fontWeight: 600 }}>
              {progresoPorcentaje >= 20 ? '✓' : '○'} Lectura Documentos / Descompresión
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: progresoPorcentaje >= 40 ? '#047857' : '#94A3B8', fontWeight: 600 }}>
              {progresoPorcentaje >= 40 ? '✓' : '○'} Extracción de Variables Clínicas
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: progresoPorcentaje >= 80 ? '#047857' : '#94A3B8', fontWeight: 600 }}>
              {progresoPorcentaje >= 80 ? '✓' : '○'} Auditoría MinSalud (CIE-10 & CUPS)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: progresoPorcentaje >= 100 ? '#047857' : '#94A3B8', fontWeight: 600 }}>
              {progresoPorcentaje >= 100 ? '✓' : '○'} Consolidación
            </span>
          </div>
        </div>
      )}

      {/* Tarjeta de Éxito Inmediato con Acceso a Historia Clínica y Auditoría */}
      {completadoReciente && completadoReciente.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #F0FDF8 0%, #FFFFFF 100%)',
          border: '2px solid #005A43',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '1.75rem',
          boxShadow: '0 12px 28px -6px rgba(0, 90, 67, 0.16)',
          animation: 'fadeIn 0.25s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ 
                background: '#005A43', 
                color: 'white', 
                borderRadius: '50%', 
                width: '38px', 
                height: '38px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexShrink: 0 
              }}>
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#005A43', margin: 0 }}>
                  ¡{completadoReciente.length === 1 ? 'Historia Clínica Procesada con Éxito' : `${completadoReciente.length} Historias Clínicas Procesadas`}!
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#475569' }}>
                  Auditoría clínica y extracción de variables completadas bajo la regla de Cero Inventiva.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  onIrAMatriz?.();
                }}
                className="btn btn-primary"
                style={{ fontSize: '0.82rem', gap: '6px' }}
              >
                <Table size={15} />
                <span>Ir a la Matriz General</span>
              </button>

              <button
                type="button"
                onClick={() => setCompletadoReciente(null)}
                className="btn btn-secondary"
                style={{ fontSize: '0.82rem' }}
              >
                Cargar Más Documentos
              </button>
            </div>
          </div>

          {/* Listado de expedientes procesados con botones directos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {completadoReciente.map((exp, idx) => (
              <div key={idx} style={{
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    background: '#ECFDF5',
                    color: '#005A43',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    border: '1px solid #A7F3D0'
                  }}>
                    {(exp.datos?.numero_historia_clinica || exp.datos?.identificacion_paciente || 'HC').replace(/\D/g, '') || 'HC'}
                  </div>

                  <div>
                    <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.94rem' }}>
                      {exp.datos?.paciente_nombre && exp.datos.paciente_nombre !== 'No especificado en el documento'
                        ? exp.datos.paciente_nombre
                        : exp.pacienteAnonimizado}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: '#005A43' }}>
                        {exp.datos?.enfermedad}
                      </span>
                      {exp.datos?.codigo_cie10 && (
                        <span style={{ background: '#005A43', color: 'white', padding: '1px 6px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                          CIE-10: {exp.datos.codigo_cie10}
                        </span>
                      )}
                      <span>• {exp.departamentoSede} ({exp.comunidadIndigena})</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => onVerExpediente?.(exp, 'documento')}
                    className="btn btn-secondary"
                    style={{
                      padding: '0.45rem 0.9rem',
                      fontSize: '0.82rem',
                      color: '#005A43',
                      borderColor: '#A7F3D0',
                      background: '#F0FDF8',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    title="Ver documento original PDF o historia clínica completa"
                  >
                    <FileText size={15} color="#005A43" />
                    <span>Ver Historia Clínica</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Zona principal de arrastrar y soltar */}
      <div
        className={`dropzone-container ${isDragging ? 'dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          manejarArchivos(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          multiple
          accept=".zip,.pdf,.docx,.doc,.txt"
          onChange={(e) => manejarArchivos(e.target.files)}
        />
        <input
          type="file"
          ref={zipInputRef}
          style={{ display: 'none' }}
          accept=".zip,application/zip,application/x-zip-compressed"
          onChange={(e) => manejarArchivos(e.target.files)}
        />
        <input
          type="file"
          ref={folderInputRef}
          style={{ display: 'none' }}
          // @ts-ignore
          webkitdirectory="true"
          // @ts-ignore
          directory="true"
          multiple
          onChange={(e) => manejarArchivos(e.target.files)}
        />

        <div className="dropzone-icon">
          <UploadCloud size={32} />
        </div>

        <h3 className="dropzone-title">
          Arrastra aquí tus archivos PDF, carpetas o un archivo comprimido .ZIP
        </h3>
        <p className="dropzone-subtitle">
          Puedes soltar un archivo <strong>.ZIP</strong> con múltiples historias clínicas o varios <strong>PDFs</strong>. La IA extraerá automáticamente datos del afiliado, fechas, médico especialista, códigos <strong>CIE-10</strong>, pruebas confirmatorias <strong>CUPS</strong> y tratamientos bajo la regla de <strong>Cero Inventiva</strong>.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => zipInputRef.current?.click()}
            disabled={procesando}
          >
            <FileArchive size={16} />
            <span>Cargar Archivo .ZIP Masivo</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={procesando}
          >
            <UploadCloud size={16} />
            <span>Seleccionar Archivos PDF</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => folderInputRef.current?.click()}
            disabled={procesando}
          >
            <FolderUp size={16} />
            <span>Cargar Carpeta</span>
          </button>
        </div>
      </div>

      {/* Acceso Rápido a Casos de Demostración Normativa */}
      <div style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Sparkles size={16} color="#005A43" />
          <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0 }}>
            Cargar Casos de Demostración Normativa MinSalud
          </h4>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
          <div
            className="demo-card"
            onClick={() => cargarCasoDemo(0)}
            style={{ cursor: 'pointer', background: 'white', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0', transition: 'all 0.2s' }}
          >
            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#005A43' }}>
              Gaucher Tipo 1 (Cesar)
            </div>
            <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: '2px' }}>
              CIE-10 E75.2 | CUPS 908346 | SIVIGILA 342 Radicado
            </div>
          </div>

          <div
            className="demo-card"
            onClick={() => cargarCasoDemo(1)}
            style={{ cursor: 'pointer', background: 'white', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0', transition: 'all 0.2s' }}
          >
            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#005A43' }}>
              Esclerosis Múltiple (La Guajira)
            </div>
            <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: '2px' }}>
              CIE-10 G35.X | RMN Gadolinio | Pueblo Wayuu
            </div>
          </div>

          <div
            className="demo-card"
            onClick={() => cargarCasoDemo(2)}
            style={{ cursor: 'pointer', background: 'white', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0', transition: 'all 0.2s' }}
          >
            <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#005A43' }}>
              Hemofilia A Severa (Codazzi)
            </div>
            <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: '2px' }}>
              CIE-10 D66.X | Factor VIII &lt;1% | CAC Hemofilia
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
