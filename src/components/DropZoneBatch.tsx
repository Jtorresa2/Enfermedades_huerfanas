import { registrarArchivoEnCache } from '../services/exportService';
import React, { useState, useRef } from 'react';
import { UploadCloud, FolderUp, Sparkles, FileCheck, ExternalLink, Loader2, CheckCircle, FileText } from 'lucide-react';
import type { IExpedienteClinico } from '../types/clinical';
import { procesarDocumentoArchivo } from '../services/extractionEngine';
import { CASOS_INICIALES } from '../data/casosEjemplo';

interface DropZoneBatchProps {
  onExpedientesProcesados: (nuevos: IExpedienteClinico[]) => void;
  geminiApiKey?: string;
  apiKey?: string;
  onOpenConfig?: () => void;
}

export const DropZoneBatch: React.FC<DropZoneBatchProps> = ({
  onExpedientesProcesados,
  geminiApiKey,
  apiKey,
  onOpenConfig
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [progresoTexto, setProgresoTexto] = useState('Analizando historia clínica...');
  const [progresoPorcentaje, setProgresoPorcentaje] = useState(15);
  const [archivoActualNombre, setArchivoActualNombre] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Asegurar siempre la clave de API activa de Gemini
  const activeKey = 
    (apiKey && apiKey.trim().length > 10 ? apiKey.trim() : null) ||
    (geminiApiKey && geminiApiKey.trim().length > 10 ? geminiApiKey.trim() : null) ||
    localStorage.getItem('dusakawi_gemini_api_key') ||
    (import.meta.env.VITE_GEMINI_API_KEY || '');

  const manejarArchivos = async (archivos: FileList | null) => {
    if (!archivos || archivos.length === 0) return;

    setProcesando(true);
    const totalArchivos = archivos.length;
    const nuevosExpedientes: IExpedienteClinico[] = [];

    for (let i = 0; i < totalArchivos; i++) {
      const archivo = archivos[i];
      registrarArchivoEnCache(archivo.name, archivo);
      setArchivoActualNombre(archivo.name);
      setProgresoPorcentaje(20);
      setProgresoTexto(`Analizando historia clínica: ${archivo.name}...`);

      try {
        const expediente = await procesarDocumentoArchivo(
          archivo, 
          activeKey,
          (pct, msg) => {
            setProgresoPorcentaje(pct);
            setProgresoTexto(msg);
          }
        );
        nuevosExpedientes.push(expediente);
      } catch (err) {
        console.error(`Error procesando archivo ${archivo.name}:`, err);
      }
    }

    setProgresoPorcentaje(100);
    setProgresoTexto('¡Extracción y auditoría completada con éxito!');
    setTimeout(() => {
      onExpedientesProcesados(nuevosExpedientes);
      setProcesando(false);
      setProgresoTexto('');
      setProgresoPorcentaje(0);
      setArchivoActualNombre('');
    }, 700);
  };

  const cargarCasoDemo = (casoIndex: number) => {
    const demo = CASOS_INICIALES[casoIndex];
    if (demo) {
      const nuevo: IExpedienteClinico = {
        ...demo,
        id: 'EXP-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        codigoCaso: 'DU-DEMO-' + Math.floor(100 + Math.random() * 900),
        fechaProcesamiento: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };
      onExpedientesProcesados([nuevo]);
    }
  };

  return (
    <div>
      {/* Barra informativa superior */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#065F46', fontSize: '0.88rem', fontWeight: 600 }}>
          <FileCheck size={18} color="#059669" />
          <span>Formatos admitidos: <strong>PDF de historias clínicas, notas médicas y fichas SIVIGILA 342</strong></span>
        </div>

        <a
          href="https://gemini.google.com/gem/8ba842f19077"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#6B21A8', borderColor: '#DDD6FE', background: '#F5F3FF', textDecoration: 'none', fontSize: '0.82rem' }}
          title="Ver tu Gema configurada en Google Gemini Web"
        >
          <ExternalLink size={14} />
          <span>Ver mi Gema en Gemini (gem/8ba842f19077)</span>
        </a>
      </div>

      {/* Tarjeta Destacada de Progreso y Análisis en Vivo */}
      {procesando && (
        <div style={{
          background: 'linear-gradient(135deg, #F0FDF8 0%, #FFFFFF 100%)',
          border: '2px solid #005A43',
          borderRadius: '16px',
          padding: '2rem 1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 12px 30px -6px rgba(0, 90, 67, 0.18)',
          textAlign: 'center',
          animation: 'fadeIn 0.25s ease-out'
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
            Analizando la historia clínica...
          </h3>

          <p style={{ fontSize: '0.9rem', color: '#475569', margin: '0 0 1.5rem 0', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <FileText size={16} color="#005A43" />
            <span>Documento: <strong>{archivoActualNombre || 'Expediente clínico'}</strong></span>
          </p>

          {/* Barra de Progreso Grande */}
          <div style={{ maxWidth: '520px', margin: '0 auto 1rem' }}>
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
              {progresoPorcentaje >= 20 ? '✓' : '○'} Lectura PDF
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
          accept=".pdf,.docx,.doc,.txt"
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
          Arrastra aquí tus archivos PDF o carpetas de expedientes
        </h3>
        <p className="dropzone-subtitle">
          Al soltar tus documentos, la IA de Gemini extraerá automáticamente el paciente, fechas, médico tratante, especialidad, códigos <strong>CIE-10</strong>, pruebas confirmatorias <strong>CUPS</strong>, medicamentos formulados y radicado <strong>SIVIGILA 342</strong> bajo la regla de <strong>Cero Inventiva</strong>.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
          <button
            className="btn btn-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={procesando}
          >
            <UploadCloud size={16} />
            <span>Seleccionar Archivos PDF</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => folderInputRef.current?.click()}
            disabled={procesando}
          >
            <FolderUp size={16} />
            <span>Cargar Carpeta Completa</span>
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
