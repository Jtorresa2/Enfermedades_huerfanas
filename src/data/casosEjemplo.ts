import type { IExpedienteClinico } from '../types/clinical';
import { REAL_ANDRES_GIL_PDF_BASE64 } from './realPdfBase64';

export const PROMPT_MINSALUD_SISTEMA = `OBJETIVO:
Actuarás como el Auditor y Extractor Médico Especializado de Historias Clínicas y Expedientes de Enfermedades Huérfanas de Colombia para DUSAKAWI EPSI.
Debes analizar minuciosamente el documento adjunto (PDF o texto de historia clínica) y extraer con rigor técnico todas las variables clínicas y normativas.

REGLAS DE ORO (CERO INVENTIVA):
1. Extrae ÚNICAMENTE la información explícitamente presente en el documento.
2. Si un dato no se encuentra en el documento, asigna el valor exacto: "No especificado en el documento".
3. Prioriza siempre los códigos oficiales (CIE-10, ID MinSalud de la Resolución de Enfermedades Huérfanas) y códigos de procedimiento o laboratorio (CUPS).

ESTRUCTURA DE SALIDA REQUERIDA (JSON ESTRICTO):
{
  "enfermedad": "Nombre oficial de la patología o enfermedad huérfana detectada según el CÓDIGO DX / DIAGNÓSTICO PRINCIPAL (ej. Hemofilia A Congénita, Hemoglobinuria Paroxística Nocturna (HPN), Enfermedad de Gaucher, etc.)",
  "codigo_cie10": "Código CIE-10 oficial exacto. BÚSCALO en la historia clínica bajo encabezados o campos como: 'CÓDIGO DX', 'CODIGO DX', 'COD DX', 'CÓD. DX', 'DIAGNÓSTICO PRINCIPAL (DX)', 'DX:', 'DX PRINCIPAL', o el código alfanumérico de 3 o 4 caracteres (ej. D66, D67, D595, E75.2, etc.). Si en el documento no viene el código escrito pero sí el nombre del diagnóstico, asigna el código CIE-10 oficial correspondiente de MinSalud.",
  "id_oficial_minsalud": "ID Oficial en el listado de Enfermedades Huérfanas de Colombia (Resolución 023 de 2023 o aplicable)",
  "categoria_grupo": "Clasificación nosológica o grupo de la patología",
  "definicion": "Resumen clínico completo y detallado de la atención médica: motivo de consulta, antecedentes patológicos relevantes, resumen de la nota de evolución clínica y conducta médica.",
  "paciente_nombre": "Nombre completo del paciente o afiliado que figura en la historia",
  "identificacion_paciente": "Tipo y número de documento de identidad (ej. CC 1082836713)",
  "fecha_diagnostico": "Fecha de la consulta, atención o diagnóstico (ej. 06/08/2026)",
  "medico_tratante": "Nombre completo del médico tratante que atiende o firma la historia clínica con su registro médico si aparece",
  "numero_historia_clinica": "Número de historia clínica o documento del paciente (solo dígitos sin puntos ni letras)",
  "especialidad_medico_tratante": "Especialidad médica que suscribe la atención (ej. Hematología, Neurología, etc.)",
  "criterio_confirmacion": "Criterio de confirmación diagnóstica (nuevo confirmado, control, prueba Gold Standard)",
  "criterios_diagnosticos_confirmatorios": [
    "Prueba o criterio confirmatorio 1 con su código CUPS si aplica",
    "Prueba o criterio confirmatorio 2"
  ],
  "pruebas_diagnosticas_realizadas": [
    "Examen de laboratorio o procedimiento 1 ordenado o reportado (incluir código CUPS numérico de 6 dígitos)",
    "Examen 2 con su código CUPS"
  ],
  "tratamiento_actual": [
    "Medicamento formulado 1, concentración, dosis, vía de administración e indicación",
    "Medicamento formulado 2"
  ],
  "sintomas_clave": [
    "Síntoma, hallazgo o manifestación clínica 1",
    "Síntoma o hallazgo 2"
  ],
  "normativa_y_respaldo_legal": {
    "listado_oficial": "Resolución o Ley aplicable mencionada",
    "requisitos_validacion": [
      "Requisito 1 (ej. registro SIVIGILA, RNPEH, CAC)",
      "Requisito 2 (ej. especialidad médica requerida)"
    ]
  },
  "notificacion_sivigila_342": "Número de radicado SIVIGILA evento 342 si se menciona, o 'No especificado en el documento'",
  "diagnostico_diferencial": [
    "Patología o diagnóstico diferencial 1",
    "Patología o diagnóstico diferencial 2"
  ]
}`;

export const CASOS_INICIALES: IExpedienteClinico[] = [
  {
    id: "EXP-2026-836",
    codigoCaso: "DU-AUD-836",
    nombreArchivo: "ANDRES GIL GIL_HCL_DUSAKAWI IPS_ CONTROL HEMATOLOGIA_06 08 2026.pdf",
    pacienteAnonimizado: "Andres Gil Gil (CC 1082836713)",
    comunidadIndigena: "Comunidad Indígena Afiliada (DUSAKAWI)",
    departamentoSede: "Cesar",
    fechaProcesamiento: "2026-08-06 10:15",
    tamanoKb: 435,
    origen: "LOTE_LOCAL",
    archivoBase64: REAL_ANDRES_GIL_PDF_BASE64,
    datos: {
      enfermedad: "Hemoglobinuria Paroxística Nocturna (HPN)",
      codigo_cie10: "D595",
      id_oficial_minsalud: "ID-294 (Resolución 023 de 2023 MinSalud)",
      categoria_grupo: "Anemias hemolíticas adquiridas clonales / Defectos de anclaje GPI",
      definicion: "Paciente masculino con diagnóstico confirmado de Hemoglobinuria Paroxística Nocturna (HPN), valorado en consulta de control especializada por Hematología en DUSAKAWI IPS. Presenta cuadro clínico de anemia hemolítica intravascular con fatiga, ictericia y coluria matutina intermitente. Requiere seguimiento de clona HPN y manejo farmacológico específico.",
      paciente_nombre: "Andres Gil Gil",
      identificacion_paciente: "CC 1082836713",
      numero_historia_clinica: "1082836713",
      fecha_diagnostico: "06/08/2026",
      criterio_confirmacion: "Citometría de flujo para CD55 y CD59 en granulocitos y eritrocitos (Gold Standard confirmado)",
      especialidad_medico_tratante: "Hematología",
      medico_tratante: "Dr. Luis Eduardo Quintero Fragozo (RM 1332/93)",
      pruebas_diagnosticas_realizadas: [
        "Citometría de flujo de alta sensibilidad para CD55 y CD59 (FLAER) (CUPS 908344)",
        "Hemograma completo con recuento de plaquetas y reticulocitos (CUPS 902210)",
        "Deshidrogenasa Láctica (LDH) y Haptoglobina sérica (CUPS 903828)"
      ],
      tratamiento_actual: [
        "Eculizumab 900 mg infusión IV cada 14 días",
        "Ácido fólico 1 mg vía oral diario",
        "Suplementación de hierro según perfil férrico"
      ],
      notificacion_sivigila_342: "SIV-342-2026-8361 (Radicado)",
      criterios_diagnosticos_confirmatorios: [
        "Ausencia/deficiencia de proteínas de anclaje GPI (CD55 y CD59) demostrada por citometría de flujo multiparamétrica (CUPS 908344)",
        "Evidencia bioquímica de hemólisis intravascular con LDH elevada y haptoglobina consumida",
        "Concepto y conducta por especialista en Hematología"
      ],
      sintomas_clave: [
        "Anemia hemolítica intravascular crónica con astenia y palidez mucocutánea",
        "Episodios de orinas oscuras matutinas (hemoglobinuria)",
        "Riesgo elevado de eventos trombóticos venosos"
      ],
      normativa_y_respaldo_legal: {
        listado_oficial: "Resolución 023 de 2023 MinSalud (ID-294) y Ley 1392 de 2010",
        requisitos_validacion: [
          "Reporte oficial SIVIGILA 342 y seguimiento ante SISPRO / RNEH",
          "Citometría de flujo confirmatoria emitida por laboratorio especializado",
          "Concepto suscrito por especialista en Hematología"
        ]
      },
      diagnostico_diferencial: [
        "Anemia hemolítica autoinmune (AHAI) con Coombs directo",
        "Aplasia medular / Síndrome mielodisplásico asociado",
        "Microangiopatía trombótica (PTT / SHU)"
      ]
    },
    auditoria: {
      estado: "CONFORME",
      tieneCie10Valido: true,
      tieneCupsConfirmatorio: true,
      tieneNotificacionObligatoria: true,
      tieneEspecialista: true,
      scoreCumplimiento: 100,
      alertas: [],
      fortalezas: [
        "CIE-10 D595 oficial registrado para Hemoglobinuria Paroxística Nocturna (HPN).",
        "Confirmación paraclínica Gold Standard por Citometría de flujo (CD55/CD59).",
        "Atención suscrita por Hematólogo tratante Dr. Luis Eduardo Quintero Fragozo.",
        "Notificación SIVIGILA 342 y soporte normativo MinSalud vigente."
      ],
      especialistaDetectado: "Hematología (Dr. Luis Eduardo Quintero Fragozo)",
      pruebaGoldStandardDetectada: "Citometría de Flujo CD55/CD59 (CUPS 908344)",
      observacionAuditoria: "Expediente CONFORME 100% con los lineamientos técnicos del Ministerio de Salud y Cuenta de Alto Costo."
    },
    textoOriginal: `================================================================================
DUSAKAWI EPSI - HISTORIA CLÍNICA DE ATENCIÓN ESPECIALIZADA
Expediente: ANDRES GIL GIL_HCL_DUSAKAWI IPS_ CONTROL HEMATOLOGIA_06 08 2026.pdf | Sede: Cesar
================================================================================
INFORMACIÓN DEL AFILIADO / PACIENTE:
• Nombre: Andres Gil Gil (CC 1082836713)
• Documento / Folio HC: 1082836713
• Comunidad Indígena: Comunidad Indígena Afiliada (DUSAKAWI)
• Fecha de Atención: 06/08/2026

--------------------------------------------------------------------------------
EQUIPO MÉDICO TRATANTE:
• Médico: Dr. Luis Eduardo Quintero Fragozo (RM 1332/93)
• Especialidad: Hematología

--------------------------------------------------------------------------------
DIAGNÓSTICO Y NOTA DE EVOLUCIÓN:
• Patología: Hemoglobinuria Paroxística Nocturna (HPN)
• Código CIE-10: D595
• ID Oficial MinSalud: ID-294 (Resolución 023 de 2023 MinSalud)
• Resumen Clínico / Nota de Atención:
  Paciente masculino con diagnóstico confirmado de Hemoglobinuria Paroxística Nocturna (HPN), valorado en consulta de control especializada por Hematología en DUSAKAWI IPS. Presenta adecuada tolerancia al tratamiento biológico inhibidor del complemento (Eculizumab), sin nuevos episodios agudos de trombosis ni requerimiento transfusional en el último trimestre.
--------------------------------------------------------------------------------
PARACLÍNICOS Y PRUEBAS DIAGNÓSTICAS (CUPS):
  ✓ Citometría de flujo para CD55 y CD59 (FLAER) (CUPS 908344)
  ✓ Hemograma IV con recuento de plaquetas y reticulocitos (CUPS 902210)
  ✓ Deshidrogenasa Láctica (LDH: 340 U/L) (CUPS 903828)

--------------------------------------------------------------------------------
TRATAMIENTO FARMACOLÓGICO / PLAN DE MANEJO:
  💊 Eculizumab 900 mg infusión intravenosa cada 14 días
  💊 Ácido Fólico 1 mg vía oral cada 24 horas

--------------------------------------------------------------------------------
AUDITORÍA MÉDICA DUSAKAWI EPSI:
• Estado: CONFORME (100%)
• Notificación SIVIGILA 342: CUMPLE (Radicado SIV-342-2026-8361)
• Dictamen: Expediente clínico 100% conforme a los lineamientos del Ministerio de Salud y Cuenta de Alto Costo.
================================================================================`
  }
];
