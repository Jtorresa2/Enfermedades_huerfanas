// Tipos TypeScript Estrictos para DUSAKAWI EPSI
// Módulo de Extracción y Auditoría Clínica de Enfermedades Huérfanas (MinSalud Colombia)

export interface INormativaRespaldoLegal {
  listado_oficial: string;
  requisitos_validacion: string[];
}

export interface IEnfermedadHuerfana {
  enfermedad: string;
  codigo_cie10: string;
  id_oficial_minsalud: string;
  categoria_grupo: string;
  definicion?: string;
  criterios_diagnosticos_confirmatorios: string[];
  sintomas_clave?: string[];
  normativa_y_respaldo_legal?: INormativaRespaldoLegal;
  diagnostico_diferencial: string[];
  // Variables clínicas detalladas de la atención
  paciente_nombre?: string;
  identificacion_paciente?: string;
  numero_historia_clinica?: string;
  fecha_diagnostico?: string;
  criterio_confirmacion?: string;
  especialidad_medico_tratante?: string;
  medico_tratante?: string;
  pruebas_diagnosticas_realizadas?: string[];
  tratamiento_actual?: string[];
  notificacion_sivigila_342?: string;
}

export type NivelConformidad = 'CONFORME' | 'INCOMPLETO' | 'CRITICO';

export interface IIAuditoriaFicha {
  estado: NivelConformidad;
  tieneCie10Valido: boolean;
  tieneCupsConfirmatorio: boolean;
  tieneNotificacionObligatoria: boolean;
  tieneEspecialista: boolean;
  cumpleCeroInventiva?: boolean;
  scoreCumplimiento: number; // 0 - 100
  alertas: string[];
  fortalezas: string[];
  especialistaDetectado?: string;
  pruebaGoldStandardDetectada?: string;
  observacionAuditoria?: string;
}

export type IAuditoriaFicha = IIAuditoriaFicha;

export interface IExpedienteClinico {
  id: string;
  codigoCaso: string;
  nombreArchivo: string;
  pacienteAnonimizado: string;
  comunidadIndigena: string;
  departamentoSede: 'Cesar' | 'La Guajira' | 'Magdalena' | 'Otro';
  fechaProcesamiento: string;
  tamanoKb: number;
  origen: 'LOTE_LOCAL' | 'CASO_PRECARGADO' | 'GOOGLE_DRIVE';
  datos: IEnfermedadHuerfana;
  auditoria: IAuditoriaFicha;
  textoOriginal: string;
  archivoBase64?: string;
}

export interface IConfiguracionIntegracion {
  geminiApiKey: string;
  usarApiReal: boolean;
  googleDriveCarpeta: string;
  webhookUrl: string;
  notificarSivigilaAuto: boolean;
  sedePredeterminada: string;
}
