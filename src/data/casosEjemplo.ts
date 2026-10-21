import type { IExpedienteClinico } from '../types/clinical';

export const PROMPT_MINSALUD_SISTEMA = `OBJETIVO:
Actuarás como el Auditor y Extractor Médico Especializado de Historias Clínicas y Expedientes de Enfermedades Huérfanas de Colombia para DUSAKAWI EPSI.
Debes analizar minuciosamente el documento adjunto (PDF o texto de historia clínica) y extraer con rigor técnico todas las variables clínicas y normativas.

REGLAS DE ORO (CERO INVENTIVA):
1. Extrae ÚNICAMENTE la información explícitamente presente en el documento.
2. Si un dato no se encuentra en el documento, asigna el valor exacto: "No especificado en el documento".
3. Prioriza siempre los códigos oficiales (CIE-10, ID MinSalud de la Resolución de Enfermedades Huérfanas) y códigos de procedimiento o laboratorio (CUPS).

ESTRUCTURA DE SALIDA REQUERIDA (JSON ESTRICTO):
{
  "enfermedad": "Nombre oficial de la patología o enfermedad huérfana detectada (ej. Hemoglobinuria Paroxística Nocturna (HPN), Enfermedad de Gaucher, Hemofilia, etc.)",
  "codigo_cie10": "Código CIE-10 oficial exacto (ej. D595, E75.2, D66, I10X, etc.). Si en el documento no viene el código escrito pero sí el nombre del diagnóstico, asigna el código CIE-10 oficial correspondiente de MinSalud.",
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
    id: "EXP-2026-001",
    codigoCaso: "DU-GAU-01",
    nombreArchivo: "FT_Enfermedad_Gaucher_Valledupar_SIV342.pdf",
    pacienteAnonimizado: "Paciente Afiliado #DKW-88214 (Kankuamo)",
    comunidadIndigena: "Pueblo Kankuamo (Atánquez, Cesar)",
    departamentoSede: "Cesar",
    fechaProcesamiento: "2026-10-19 14:32",
    tamanoKb: 412,
    origen: "CASO_PRECARGADO",
    datos: {
      enfermedad: "Enfermedad de Gaucher Tipo 1",
      codigo_cie10: "E75.2",
      id_oficial_minsalud: "ID-450 (Resolución 023 de 2023 MinSalud)",
      categoria_grupo: "Enfermedades por depósito lisosomal / Trastornos del metabolismo de los esfingolípidos",
      definicion: "Trastorno genético autosómico recesivo multisistémico causado por la deficiencia de la enzima beta-glucocerebrosidasa ácida, provocando acumulación de glucosilceramida en macrófagos del sistema reticuloendotelial (células de Gaucher).",
      paciente_nombre: "María Elena Arias Kankui",
      identificacion_paciente: "CC 49.782.110",
      fecha_diagnostico: "15/09/2026",
      criterio_confirmacion: "Enzimático y genético molecular confirmado",
      especialidad_medico_tratante: "Hematología y Genética Médica",
      medico_tratante: "Dr. Carlos Alberto Mendoza (RM 11482)",
      pruebas_diagnosticas_realizadas: [
        "Determinación de beta-glucocerebrosidasa en leucocitos (CUPS 908346)",
        "Secuenciación de gen GBA1 (CUPS 908412)",
        "Hemograma IV completo (CUPS 902210)"
      ],
      tratamiento_actual: [
        "Imiglucerasa 60 UI/kg IV cada 14 días",
        "Calcio + Vitamina D3 oral"
      ],
      notificacion_sivigila_342: "SIV-342-2026-8812 (Radicado)",
      criterios_diagnosticos_confirmatorios: [
        "Demostración de actividad enzimática disminuida de beta-glucocerebrosidasa ácida en leucocitos de sangre periférica (CUPS 908346)",
        "Secuenciación genética del gen GBA1 para detección de mutaciones confirmatorias (CUPS 908412)",
        "Biopsia de médula ósea con presencia patognomónica de células de Gaucher en histopatología (CUPS 890401)"
      ],
      sintomas_clave: [
        "Esplenomegalia masiva y hepatomegalia no dolorosa",
        "Trombocitopenia refractaria y anemia normocítica",
        "Crisis óseas severas, osteopenia y deformidad en matraz de Erlenmeyer",
        "Astenia marcada y sangrado mucocutáneo"
      ],
      normativa_y_respaldo_legal: {
        listado_oficial: "Ley 1392 de 2010 y Resolución 5265 / Resolución 023 de 2023 MinSalud",
        requisitos_validacion: [
          "Ficha de notificación obligatoria SIVIGILA Evento 342 debidamente radicada",
          "Inscripción activa en el Registro Nacional de Pacientes con Enfermedades Huérfanas (RNPEH / SISPRO)",
          "Concepto y orden médica suscrita por especialista certificado en Hematología o Genética Médica",
          "Reporte trimestral ante la Cuenta de Alto Costo (CAC)"
        ]
      },
      diagnostico_diferencial: [
        "Leucemia mieloide crónica o síndromes mielodisplásicos",
        "Enfermedad de Niemann-Pick (Tipos A y B)",
        "Hiperesplenismo idiopático o por hipertensión portal"
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
        "CIE-10 E75.2 correctamente validado frente a la Resolución 023 de 2023.",
        "Prueba Gold Standard enzimática (CUPS 908346) y molecular presentes.",
        "Notificación epidemiológica SIVIGILA 342 radicada.",
        "Aval por Hematología y Genética Médica."
      ],
      especialistaDetectado: "Hematología y Genética Médica",
      pruebaGoldStandardDetectada: "Actividad Beta-Glucocerebrosidasa (CUPS 908346)",
      observacionAuditoria: "Expediente 100% conforme con los requerimientos normativos del Ministerio de Salud."
    },
    textoOriginal: `HISTORIA CLÍNICA DE CONTROL - DUSAKAWI EPSI
Sede Territorial Cesar / Valledupar
Paciente: María Elena Arias Kankui (CC 49.782.110) - Comunidad Kankuama de Atánquez.
Diagnóstico Principal: Enfermedad de Gaucher Tipo 1 (CIE-10: E75.2). ID MinSalud: 450.
Especialista: Dr. Carlos Alberto Mendoza - Hematología (RM 11482).
Laboratorios: Actividad de beta-glucosidasa ácida en leucocitos: 1.2 nmol/h/mg (VR: 6.0 - 14.5) (CUPS 908346). Mutación N370S en gen GBA1 confirmada (CUPS 908412).
SIVIGILA: Notificación individual Evento 342 radicada bajo el N° SIV-342-2026-8812.
Tratamiento: Terapia de reemplazo enzimático con Imiglucerasa 60 UI/kg IV en infusión ambulatoria.`
  },
  {
    id: "EXP-2026-002",
    codigoCaso: "DU-EMR-02",
    nombreArchivo: "Caso_Esclerosis_Multiple_Riohacha_Wayuu.pdf",
    pacienteAnonimizado: "Paciente Afiliado #DKW-44109 (Wayuu)",
    comunidadIndigena: "Pueblo Wayuu (Caimito, La Guajira)",
    departamentoSede: "La Guajira",
    fechaProcesamiento: "2026-10-19 16:15",
    tamanoKb: 388,
    origen: "CASO_PRECARGADO",
    datos: {
      enfermedad: "Esclerosis Múltiple Remitente-Recurrente",
      codigo_cie10: "G35.X",
      id_oficial_minsalud: "ID-312 (Resolución 023 de 2023 MinSalud)",
      categoria_grupo: "Enfermedades desmielinizantes inflamatorias del sistema nervioso central",
      definicion: "Patología autoinmune crónica inflamatoria desmielinizante del SNC con destrucción mediada por linfocitos de la vaina de mielina axonal.",
      paciente_nombre: "José David Uriana Epieyu",
      identificacion_paciente: "CC 84.109.332",
      fecha_diagnostico: "10/08/2026",
      criterio_confirmacion: "Criterios de McDonald 2017 cumplidos (Diseminación en espacio y tiempo)",
      especialidad_medico_tratante: "Neurología Clínica",
      medico_tratante: "Dra. Patricia Gómez (RM 20419)",
      pruebas_diagnosticas_realizadas: [
        "Resonancia Magnética Cerebral con Contraste Gadolinio (CUPS 881232)",
        "Bandas Oligoclonales en LCR (CUPS 906421)"
      ],
      tratamiento_actual: [
        "Fingolimod 0.5 mg vía oral diario",
        "Metilprednisolona en pulsos durante recaídas"
      ],
      notificacion_sivigila_342: "SIV-342-2026-4419 (Radicado)",
      criterios_diagnosticos_confirmatorios: [
        "Resonancia Magnética Cerebral y Medular con gadolinio evidenciando lesiones desmielinizantes periventriculares y yuxtacorticales (CUPS 881232)",
        "Presencia de bandas oligoclonales IgG positivas en líquido cefalorraquídeo (CUPS 906421)",
        "Cumplimiento estricto de Criterios de McDonald 2017 de diseminación en espacio y tiempo"
      ],
      sintomas_clave: [
        "Neuritis óptica unilateral con dolor periocular",
        "Parestesias migratorias y déficit motor en extremidades inferiores",
        "Signo de Lhermitte positivo",
        "Fatiga extrema de predominio vespertino"
      ],
      normativa_y_respaldo_legal: {
        listado_oficial: "Resolución 023 de 2023 MinSalud y Guía Práctica Clínica MinSalud",
        requisitos_validacion: [
          "Reporte oficial SIVIGILA 342 y seguimiento CAC",
          "Concepto firmado por Neurólogo Clínico",
          "Escala de Kurtzke (EDSS) actualizada periódicamente"
        ]
      },
      diagnostico_diferencial: [
        "Trastorno del espectro de neuromielitis óptica (anti-AQP4 positivo)",
        "Enfermedad por anticuerpos anti-MOG (MOGAD)",
        "Lupus eritematoso sistémico o síndrome de Sjögren primario"
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
        "CIE-10 G35.X confirmado.",
        "Resonancia con CUPS 881232 y Bandas en LCR CUPS 906421.",
        "Ficha SIVIGILA 342 verificada.",
        "Atención por Neurología Clínica."
      ],
      especialistaDetectado: "Neurología Clínica",
      pruebaGoldStandardDetectada: "RMN Cerebral Gadolinio (CUPS 881232) + Bandas LCR (CUPS 906421)",
      observacionAuditoria: "Cumplimiento normativo total de criterios diagnósticos de McDonald y validación ante Cuenta de Alto Costo."
    },
    textoOriginal: `CONSULTA EXTERNA NEUROLOGÍA - DUSAKAWI EPSI
Sede Riohacha / La Guajira
Paciente: José David Uriana Epieyu (CC 84.109.332) - Pueblo Wayuu.
Diagnóstico: Esclerosis Múltiple Remitente-Recurrente (CIE-10 G35.X).
Especialista: Dra. Patricia Gómez - Neuróloga Clínica.
Estudios: RMN de encéfalo contrastada con gadolinio (CUPS 881232) reporta múltiples placas desmielinizantes activas periventriculares cumpliendo criterios de McDonald. Punción lumbar con bandas oligoclonales IgG positivas en LCR (CUPS 906421).
SIVIGILA: Ficha individual evento 342 radicada satisfactoriamente en SISPRO.`
  },
  {
    id: "EXP-2026-003",
    codigoCaso: "DU-HEM-03",
    nombreArchivo: "Paciente_Hemofilia_A_Severa_Codazzi.pdf",
    pacienteAnonimizado: "Paciente Afiliado #DKW-91203 (Yukpa)",
    comunidadIndigena: "Pueblo Yukpa (Serranía del Perijá, Codazzi)",
    departamentoSede: "Cesar",
    fechaProcesamiento: "2026-10-20 09:40",
    tamanoKb: 520,
    origen: "CASO_PRECARGADO",
    datos: {
      enfermedad: "Hemofilia A Congénita Severa",
      codigo_cie10: "D66.X",
      id_oficial_minsalud: "ID-118 (Resolución 023 de 2023 MinSalud)",
      categoria_grupo: "Coagulopatías congénitas y deficiencias de factores de coagulación",
      definicion: "Trastorno hemorrágico hereditario ligado al cromosoma X producido por deficiencia del Factor VIII de coagulación (< 1% de actividad normal).",
      paciente_nombre: "Brayan Javier Peñaranda Yukpa",
      identificacion_paciente: "TI 1.092.341.203",
      fecha_diagnostico: "12/07/2026",
      criterio_confirmacion: "Dosaje de Factor VIII < 1% en plasma",
      especialidad_medico_tratante: "Hematología Pediátrica",
      medico_tratante: "Dr. Luis Eduardo Quintero (RM 1332)",
      pruebas_diagnosticas_realizadas: [
        "Dosaje coagulométrico de Factor VIII (CUPS 902024)",
        "Tiempos de Coagulación TP y TPT (CUPS 902049)"
      ],
      tratamiento_actual: [
        "Factor VIII Recombinante 2000 UI en profilaxis 3 veces por semana",
        "Ácido tranexámico en caso de hemorragia bucal"
      ],
      notificacion_sivigila_342: "SIV-342-2026-9120 (Radicado)",
      criterios_diagnosticos_confirmatorios: [
        "Dosaje cuantitativo de actividad coagulante de Factor VIII en plasma menor al 1% (CUPS 902024)",
        "Tiempo de Tromboplastina Parcial Activada (TPT) marcadamente prolongado que corrige con plasma normal (CUPS 902049)"
      ],
      sintomas_clave: [
        "Hemartrosis recurrentes espontáneas en rodillas y codos",
        "Hematomas musculares profundos tras traumas menores",
        "Sangrado prolongado posextracción dental"
      ],
      normativa_y_respaldo_legal: {
        listado_oficial: "Resolución 023 de 2023 MinSalud y CAC Hemofilia",
        requisitos_validacion: [
          "Reporte mandatorio anual ante la Cuenta de Alto Costo (CAC)",
          "Inscripción activa en SIVIGILA 342 y ficha CAC",
          "Manejo profiláctico prescrito por Hematólogo"
        ]
      },
      diagnostico_diferencial: [
        "Enfermedad de von Willebrand (Tipo 2N o Tipo 3)",
        "Hemofilia B congénita (deficiencia de Factor IX - D67.X)"
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
        "CIE-10 D66.X correspondiente a Hemofilia A.",
        "Dosaje de Factor VIII menor a 1% con CUPS 902024 verificado.",
        "Auditoría CAC y radicado SIVIGILA 342 al día.",
        "Prescripción por Hematología."
      ],
      especialistaDetectado: "Hematología",
      pruebaGoldStandardDetectada: "Dosaje de Factor VIII en Plasma (CUPS 902024)",
      observacionAuditoria: "Paciente con esquema profiláctico óptimo y seguimiento riguroso por Hematología."
    },
    textoOriginal: `HOSPITAL LOCAL AGUSTÍN CODAZZI / DUSAKAWI EPSI
Control Especializado Hematología
Paciente: Brayan Javier Peñaranda (TI 1.092.341.203) - Pueblo Yukpa.
Diagnóstico: Hemofilia A Congénita Severa (CIE-10 D66.X). ID MinSalud 118.
Laboratorio: Dosaje de Factor VIII en plasma: < 0.8% de actividad coagulante (CUPS 902024). TPT prolongado en 78 seg (testigo 29 seg). Titulación de inhibidores negativa (CUPS 902035).
Plan: Continuar profilaxis primaria con Factor VIII recombinante 2000 UI IV 3 veces por semana. Registro en CAC y SIVIGILA 342 completado.`
  },
  {
    id: "EXP-2026-004",
    codigoCaso: "DU-FIB-04",
    nombreArchivo: "Nota_Evolucion_Fibrosis_Quistica_SantaMarta.pdf",
    pacienteAnonimizado: "Paciente Afiliada #DKW-33104 (Wiwa)",
    comunidadIndigena: "Pueblo Wiwa (Sierra Nevada, Santa Marta)",
    departamentoSede: "Magdalena",
    fechaProcesamiento: "2026-10-20 10:02",
    tamanoKb: 460,
    origen: "CASO_PRECARGADO",
    datos: {
      enfermedad: "Fibrosis Quística con Manifestaciones Pulmonares",
      codigo_cie10: "E84.0",
      id_oficial_minsalud: "ID-380 (Resolución 023 de 2023 MinSalud)",
      categoria_grupo: "Trastornos genéticos de glándulas exocrinas y transporte iónico",
      definicion: "Enfermedad autosómica recesiva multisistémica provocada por mutaciones en el gen CFTR que alteran el canal epitelial de cloruro.",
      paciente_nombre: "Lucía Sofía Malo Wiwa",
      identificacion_paciente: "RC 1.082.991.042",
      fecha_diagnostico: "05/06/2026",
      criterio_confirmacion: "Test de sudor positivo y variante CFTR homocigota",
      especialidad_medico_tratante: "Neumología Pediátrica",
      medico_tratante: "Dra. Isabel Fonseca (RM 18742)",
      pruebas_diagnosticas_realizadas: [
        "Test de sudor por iontoforesis con pilocarpina (CUPS 903841)",
        "Panel genético molecular de mutaciones CFTR (CUPS 908433)"
      ],
      tratamiento_actual: [
        "Dornasa alfa inhalada 2.5 mg/día",
        "Enzimas pancreáticas con cada comida"
      ],
      notificacion_sivigila_342: "SIV-342-2026-3310 (Radicado)",
      criterios_diagnosticos_confirmatorios: [
        "Test de sudor cuantitativo positivo por iontoforesis con pilocarpina demostrando Cloro > 60 mmol/L (CUPS 903841)",
        "Identificación de dos variantes patogénicas en el gen regulador de conductancia transmembrana (CFTR) (CUPS 908433)"
      ],
      sintomas_clave: [
        "Infecciones respiratorias bacterianas a repetición por Pseudomonas",
        "Insuficiencia pancreática exocrina con esteatorrea",
        "Retardo del crecimiento pondoestatural"
      ],
      normativa_y_respaldo_legal: {
        listado_oficial: "Resolución 023 de 2023 MinSalud",
        requisitos_validacion: [
          "Reporte SIVIGILA 342 y seguimiento CAC",
          "Concepto de Neumología Pediátrica",
          "Evaluación trimestral de función pulmonar"
        ]
      },
      diagnostico_diferencial: [
        "Inmunodeficiencias congénitas o déficit selectivo de IgA",
        "Bronquiectasias no asociadas a FQ y asma severa refractaria"
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
        "CIE-10 E84.0 verificado.",
        "Ionotest positivo con CUPS 903841 (> 60 mEq/L de cloro).",
        "Validación por Neumología Pediátrica y registro SIVIGILA."
      ],
      especialistaDetectado: "Neumología Pediátrica",
      pruebaGoldStandardDetectada: "Test de Sudor Iontoforesis (CUPS 903841)",
      observacionAuditoria: "Diagnóstico 100% verificado con confirmación genética y electrolitos en sudor."
    },
    textoOriginal: `DUSAKAWI EPSI - SUBDIRECCION DE SALUD
Sede Santa Marta / Comunidad Wiwa
Ficha Clínica: DKW-33104
Diagnóstico: Fibrosis Quística (CIE-10 E84.0) - ID MinSalud 380
Motivo: Paciente femenina de 5 años con tos crónica húmeda, colonización por Pseudomonas aeruginosa y desnutrición aguda moderada.
Laboratorio: Test de electrolitos en sudor (CUPS 903841): Cloro en sudor 84 mmol/L en dos determinaciones distintas. Genética CFTR detecta variante p.Phe508del homocigota.
Normativa: Notificada en SIVIGILA 342. Orden médica suscrita por Neumología Pediátrica con indicación de dornasa alfa y enzimas pancreáticas.`
  },
  {
    id: "EXP-2026-005",
    codigoCaso: "DU-INC-05",
    nombreArchivo: "Expediente_Incompleto_SinConfirmar_Maicao.pdf",
    pacienteAnonimizado: "Paciente Afiliado #DKW-10492 (Wayuu)",
    comunidadIndigena: "Pueblo Wayuu (Ranchería Maicao)",
    departamentoSede: "La Guajira",
    fechaProcesamiento: "2026-10-20 08:12",
    tamanoKb: 195,
    origen: "CASO_PRECARGADO",
    datos: {
      enfermedad: "Sospecha de Atrofia Muscular Espinal (Sin tipificar)",
      codigo_cie10: "G12.9 (Inespecífico)",
      id_oficial_minsalud: "No especificado en el documento",
      categoria_grupo: "Enfermedades de la motoneurona",
      definicion: "Trastorno neuromuscular caracterizado por debilidad y atrofia de los músculos esqueléticos por degeneración de motoneuronas del asta anterior medular.",
      paciente_nombre: "No especificado en el documento",
      identificacion_paciente: "No especificado en el documento",
      fecha_diagnostico: "No especificado en el documento",
      criterio_confirmacion: "Sospecha clínica sin confirmación",
      especialidad_medico_tratante: "Médico General",
      medico_tratante: "No especificado",
      pruebas_diagnosticas_realizadas: [
        "Falta estudio genético molecular MLPA o gen SMN1 (CUPS 908420)"
      ],
      tratamiento_actual: [
        "Manejo sintomático y terapia física"
      ],
      notificacion_sivigila_342: "Pendiente radicado SIVIGILA 342",
      criterios_diagnosticos_confirmatorios: [
        "No especificado en el documento (Falta estudio genético molecular MLPA o secuenciación del gen SMN1 - CUPS 908420)"
      ],
      sintomas_clave: [
        "Hipotonia muscular severa",
        "Arreflexia osteotendinosa",
        "Llanto débil"
      ],
      normativa_y_respaldo_legal: {
        listado_oficial: "No especificado en el documento",
        requisitos_validacion: [
          "Falta notificación formal SIVIGILA 342",
          "Falta valoración por Neurología Pediátrica o Genética"
        ]
      },
      diagnostico_diferencial: [
        "Síndrome de Pompe infantil",
        "Neuropatías congénitas hipomielinizantes"
      ]
    },
    auditoria: {
      estado: "CRITICO",
      tieneCie10Valido: false,
      tieneCupsConfirmatorio: false,
      tieneNotificacionObligatoria: false,
      tieneEspecialista: false,
      scoreCumplimiento: 25,
      alertas: [
        "CIE-10 G12.9 inespecífico. Requiere tipificación molecular de AME.",
        "Ausencia de prueba genética Gold Standard (CUPS 908420).",
        "Sin notificación SIVIGILA 342.",
        "Sin concepto de Neurología Pediátrica."
      ],
      fortalezas: [],
      especialistaDetectado: "Médico General (Requiere interconsulta)",
      pruebaGoldStandardDetectada: "No especificado en el documento",
      observacionAuditoria: "ALERTA CRÍTICA: Faltan soportes obligatorios requeridos por MinSalud para justificar tecnologías y medicamentos huérfanos."
    },
    textoOriginal: `REMISIÓN MÉDICA - PUESTO DE SALUD MAICAO
Paciente pediátrico con cuadro de debilidad progresiva generalizada.
Sospecha: Atrofia Muscular Espinal.
No cuenta con estudio genético confirmatorio por barreras de acceso. Pendiente interconsulta con Neurología Infantil en hospital de tercer nivel.`
  }
];
