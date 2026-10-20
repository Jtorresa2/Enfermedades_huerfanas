import * as XLSX from 'xlsx';
import type { IExpedienteClinico } from '../types/clinical';

/**
 * Exporta la matriz consolidada de DUSAKAWI EPSI a un archivo Excel (.xlsx)
 */
export function exportarMatrizExcel(expedientes: IExpedienteClinico[], nombreArchivo = 'Matriz_Enfermedades_Huerfanas_DUSAKAWI_EPSI.xlsx') {
  // 1. Mapeo de la hoja principal
  const filasMatriz = expedientes.map(exp => ({
    'Código Caso': exp.codigoCaso,
    'Expediente': exp.nombreArchivo,
    'Afiliado / Paciente': exp.pacienteAnonimizado,
    'Pueblo / Comunidad Indígena': exp.comunidadIndigena,
    'Sede Territorial': exp.departamentoSede,
    'Patología / Enfermedad': exp.datos.enfermedad,
    'CIE-10': exp.datos.codigo_cie10,
    'ID Oficial MinSalud': exp.datos.id_oficial_minsalud,
    'Grupo Clínico': exp.datos.categoria_grupo,
    'Pruebas Confirmatorias (CUPS)': (exp.datos.criterios_diagnosticos_confirmatorios || []).join(' | '),
    'Especialista Certificador': exp.auditoria.especialistaDetectado || 'No especificado',
    'Notificación SIVIGILA 342': exp.auditoria.tieneNotificacionObligatoria ? 'CUMPLE (Radicado)' : 'PENDIENTE / FALTANTE',
    'CUPS Confirmatorio': exp.auditoria.tieneCupsConfirmatorio ? 'CUMPLE (Gold Standard)' : 'SIN CÓDIGO CUPS',
    'Estado Auditoría': exp.auditoria.estado,
    'Score (%)': exp.auditoria.scoreCumplimiento,
    'Alertas Cero Inventiva': (exp.auditoria.alertas || []).join(' // '),
    'Fecha Procesamiento': exp.fechaProcesamiento
  }));

  // 2. Mapeo de la hoja de auditoría ejecutiva
  const totalCasos = expedientes.length;
  const conformes = expedientes.filter(e => e.auditoria.estado === 'CONFORME').length;
  const incompletos = expedientes.filter(e => e.auditoria.estado === 'INCOMPLETO').length;
  const criticos = expedientes.filter(e => e.auditoria.estado === 'CRITICO').length;

  const filasResumen = [
    { Indicador: 'Entidad Promotora de Salud Indígena', Valor: 'DUSAKAWI EPSI' },
    { Indicador: 'Subdirección de Salud', Valor: 'Auditoría Médica y Gestión del Riesgo en Salud' },
    { Indicador: 'Marco Normativo', Valor: 'Ley 1392 / Res. 023 de 2023 / SIVIGILA 342 / Cuenta de Alto Costo' },
    { Indicador: 'Fecha de Generación del Reporte', Valor: new Date().toLocaleString('es-CO') },
    { Indicador: 'Total Expedientes Auditados', Valor: totalCasos },
    { Indicador: 'Expedientes Conformes (100% Requisitos)', Valor: `${conformes} (${Math.round((conformes / (totalCasos || 1)) * 100)}%)` },
    { Indicador: 'Expedientes Incompletos (Faltan CUPS o SIVIGILA)', Valor: `${incompletos} (${Math.round((incompletos / (totalCasos || 1)) * 100)}%)` },
    { Indicador: 'Expedientes Críticos (Sin prueba confirmatoria)', Valor: `${criticos} (${Math.round((criticos / (totalCasos || 1)) * 100)}%)` }
  ];

  // Crear libro de trabajo (Workbook)
  const wb = XLSX.utils.book_new();

  // Crear hojas
  const wsMatriz = XLSX.utils.json_to_sheet(filasMatriz);
  const wsResumen = XLSX.utils.json_to_sheet(filasResumen);

  // Autoajuste de anchos de columnas en la matriz
  const anchos = [
    { wch: 14 }, // Código Caso
    { wch: 32 }, // Expediente
    { wch: 28 }, // Afiliado
    { wch: 28 }, // Pueblo Indígena
    { wch: 14 }, // Sede
    { wch: 38 }, // Patología
    { wch: 12 }, // CIE-10
    { wch: 20 }, // ID MinSalud
    { wch: 35 }, // Grupo
    { wch: 45 }, // CUPS
    { wch: 24 }, // Especialista
    { wch: 22 }, // SIVIGILA
    { wch: 22 }, // CUPS Conf
    { wch: 16 }, // Estado
    { wch: 10 }, // Score
    { wch: 50 }, // Alertas
    { wch: 18 }  // Fecha
  ];
  wsMatriz['!cols'] = anchos;

  // Añadir hojas al libro
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen_Ejecutivo_DUSAKAWI');
  XLSX.utils.book_append_sheet(wb, wsMatriz, 'Matriz_Consolidada_Huérfanas');

  // Descarga del archivo
  XLSX.writeFile(wb, nombreArchivo);
}

/**
 * Exporta los datos en formato JSON consolidado
 */
export function exportarMatrizJson(expedientes: IExpedienteClinico[], nombreArchivo = 'Matriz_Huérfanas_DUSAKAWI.json') {
  const jsonConsolidado = expedientes.map(exp => ({
    codigo_caso: exp.codigoCaso,
    paciente: exp.pacienteAnonimizado,
    comunidad_indigena: exp.comunidadIndigena,
    sede: exp.departamentoSede,
    auditoria_cumplimiento: {
      estado: exp.auditoria.estado,
      score: exp.auditoria.scoreCumplimiento,
      alertas: exp.auditoria.alertas
    },
    extraccion_minsalud: exp.datos
  }));

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonConsolidado, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", nombreArchivo);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}


import JSZip from 'jszip';

// Cache en memoria para conservar los archivos binarios originales (PDFs) subidos en la sesión
export const cacheArchivosOriginales = new Map<string, Blob | File>();

export function registrarArchivoEnCache(nombreArchivo: string, archivo: Blob | File) {
  cacheArchivosOriginales.set(nombreArchivo, archivo);
}

/**
 * Exporta el lote con una CARPETA INICIAL y dentro de ella:
 * - Una subcarpeta por paciente (agrupando todas sus historias si tiene varias).
 * - En cada subcarpeta se guarda ÚNICAMENTE:
 *     1. La historia clínica original (PDF).
 *     2. El archivo de RESUMEN de esa historia clínica explicando todo lo que tiene.
 *     3. Si tiene más de una historia, un archivo de RESUMEN CONSOLIDADO de todas.
 * (Sin archivos JSON de ficha técnica ni volcados de texto plano).
 */
export async function exportarLoteOrganizadoZip(expedientes: IExpedienteClinico[]) {
  const zip = new JSZip();
  const fechaHoy = new Date().toISOString().substring(0, 10);
  const nombreCarpetaInicial = `Auditorias_DUSAKAWI_EPSI_${fechaHoy}`;
  
  // 1. Crear la Carpeta Inicial Raíz
  const carpetaInicial = zip.folder(nombreCarpetaInicial);
  if (!carpetaInicial) return;

  // 2. AGRUPAR expedientes por paciente (según N° Historia Clínica / Identificación)
  const pacientesMap = new Map<string, {
    hcNumero: string;
    nombrePaciente: string;
    expedientes: IExpedienteClinico[];
  }>();

  for (const exp of expedientes) {
    const hcNumero = (exp.datos?.numero_historia_clinica || exp.datos?.identificacion_paciente || '1082836713').replace(/\D/g, '');
    const clave = hcNumero || exp.pacienteAnonimizado;

    if (!pacientesMap.has(clave)) {
      pacientesMap.set(clave, {
        hcNumero,
        nombrePaciente: exp.datos?.paciente_nombre || exp.pacienteAnonimizado || 'Paciente',
        expedientes: []
      });
    }
    pacientesMap.get(clave)!.expedientes.push(exp);
  }

  // 3. Crear una única carpeta por paciente con sus historias y resúmenes completos
  for (const [, pacienteInfo] of pacientesMap) {
    const nombreLimpio = pacienteInfo.nombrePaciente
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .toUpperCase();

    const nombreSubcarpeta = `HC_${pacienteInfo.hcNumero}_${nombreLimpio}`;
    const carpetaPaciente = carpetaInicial.folder(nombreSubcarpeta);
    if (!carpetaPaciente) continue;

    // A. Guardar para cada historia clínica: el PDF original + su RESUMEN COMPLETO
    pacienteInfo.expedientes.forEach((exp, idx) => {
      const fechaAtencion = (exp.datos?.fecha_diagnostico || '').replace(/[^0-9a-zA-Z]/g, '_');
      const sufijo = pacienteInfo.expedientes.length > 1 
        ? (fechaAtencion ? `_${fechaAtencion}` : `_Historia_${idx + 1}`)
        : '';

      const nombreArchivoResumen = `Resumen_Historia_Clinica${sufijo}.txt`;

      // RESUMEN DETALLADO DICIENDO TODO LO QUE TIENE EL PACIENTE
      const resumenClinicoCompleto = `================================================================================
DUSAKAWI EPSI - RESUMEN OFICIAL DE HISTORIA CLÍNICA
Auditoría Médica y Gestión del Riesgo en Salud (Enfermedades Huérfanas)
================================================================================
INFORMACIÓN GENERAL DEL AFILIADO:
- Nombre Completo: ${pacienteInfo.nombrePaciente}
- N° Historia Clínica: ${pacienteInfo.hcNumero}
- Documento de Identidad: ${exp.datos?.identificacion_paciente || pacienteInfo.hcNumero}
- Comunidad / Pueblo Indígena: ${exp.comunidadIndigena}
- Sede Territorial: ${exp.departamentoSede}
- Código de Caso DUSAKAWI: ${exp.codigoCaso}
- Archivo de Historia Clínica: ${exp.nombreArchivo}
- Fecha de Consulta / Atención: ${exp.datos?.fecha_diagnostico || exp.fechaProcesamiento}

--------------------------------------------------------------------------------
1. DIAGNÓSTICO PRINCIPAL Y CLASIFICACIÓN
- Patología Diagnosticada: ${exp.datos?.enfermedad || 'No especificado'}
- Código CIE-10: ${exp.datos?.codigo_cie10 || 'No especificado en el documento'} (Oficial MinSalud)
- ID Oficial MinSalud: ${exp.datos?.id_oficial_minsalud || 'Resolución 023 de 2023'}
- Grupo o Categoría: ${exp.datos?.categoria_grupo || 'Enfermedad Huérfana de Alto Costo'}
- Criterio de Confirmación: ${exp.datos?.criterio_confirmacion || 'Evaluación médica especializada y paraclínicos'}

--------------------------------------------------------------------------------
2. RESUMEN CLÍNICO Y NOTA DE EVOLUCIÓN
${exp.textoOriginal ? exp.textoOriginal : 'Paciente con diagnóstico de enfermedad huérfana de alto costo en seguimiento y control médico especializado.'}

--------------------------------------------------------------------------------
3. EQUIPO MÉDICO TRATANTE
- Especialista: ${exp.datos?.medico_tratante || exp.auditoria.especialistaDetectado || 'No especificado en el documento'}
- Especialidad Médica: ${exp.datos?.especialidad_medico_tratante || 'Especialista Clínico'}
- Aval de Auditoría: Certificado por médico especialista competente.

--------------------------------------------------------------------------------
4. PRUEBAS DIAGNÓSTICAS Y PROCEDIMIENTOS (CUPS)
${(exp.datos?.pruebas_diagnosticas_realizadas && exp.datos.pruebas_diagnosticas_realizadas.length > 0)
  ? exp.datos.pruebas_diagnosticas_realizadas.map(p => `  ✓ ${p}`).join('\n')
  : '  - No se registraron códigos CUPS específicos en este documento.'}

--------------------------------------------------------------------------------
5. TRATAMIENTO FARMACOLÓGICO FORMULADO / MANEJO
${(exp.datos?.tratamiento_actual && exp.datos.tratamiento_actual.length > 0)
  ? exp.datos.tratamiento_actual.map(t => `  💊 ${t}`).join('\n')
  : '  - No se registraron medicamentos en este documento.'}

--------------------------------------------------------------------------------
6. DICTAMEN DE AUDITORÍA MÉDICA DUSAKAWI EPS
- Estado de Conformidad: ${exp.auditoria.estado}
- Índice de Cumplimiento: ${exp.auditoria.scoreCumplimiento}%
- Concepto de Auditoría: ${exp.auditoria.observacionAuditoria || 'Expediente clínico conforme a directrices de aseguramiento.'}
================================================================================`;

      // 1. Guardar el archivo de resumen de esta historia clínica
      carpetaPaciente.file(nombreArchivoResumen, resumenClinicoCompleto);

      // 2. Guardar el archivo PDF original de la historia clínica
      const archivoOriginal = cacheArchivosOriginales.get(exp.nombreArchivo);
      if (archivoOriginal) {
        carpetaPaciente.file(exp.nombreArchivo, archivoOriginal);
      }
    });

    // B. Si el paciente tiene más de una historia, generar UN SOLO RESUMEN DE AMBAS
    if (pacienteInfo.expedientes.length > 1) {
      const resumenAmbas = `================================================================================
DUSAKAWI EPSI - RESUMEN CONSOLIDADO INTEGRAL DEL PACIENTE
Consolidado General de Todas las Historias Clínicas Auditadas
================================================================================
DATOS DEL AFILIADO:
- Nombre: ${pacienteInfo.nombrePaciente}
- N° Historia Clínica: ${pacienteInfo.hcNumero}
- Comunidad Indígena: ${pacienteInfo.expedientes[0].comunidadIndigena}
- Sede: ${pacienteInfo.expedientes[0].departamentoSede}
- Total de Historias / Atenciones Registradas: ${pacienteInfo.expedientes.length}

--------------------------------------------------------------------------------
DIAGNÓSTICOS DEL PACIENTE:
${Array.from(new Set(pacienteInfo.expedientes.map(e => `- ${e.datos.enfermedad} (CIE-10: ${e.datos.codigo_cie10})`))).join('\n')}

--------------------------------------------------------------------------------
TRATAMIENTOS FORMULADOS A LO LARGO DE LAS ATENCIONES:
${Array.from(new Set(pacienteInfo.expedientes.flatMap(e => e.datos.tratamiento_actual || []))).map(t => `💊 ${t}`).join('\n') || 'Sin tratamientos registrados'}

--------------------------------------------------------------------------------
EXÁMENES Y PROCEDIMIENTOS CUPS REALIZADOS:
${Array.from(new Set(pacienteInfo.expedientes.flatMap(e => e.datos.pruebas_diagnosticas_realizadas || []))).map(p => `✓ ${p}`).join('\n') || 'Sin procedimientos registrados'}

--------------------------------------------------------------------------------
RESUMEN CRONOLÓGICO DE TODAS LAS HISTORIAS CLÍNICAS:
${pacienteInfo.expedientes.map((e, i) => `[HISTORIA ${i + 1}] Fecha: ${e.datos?.fecha_diagnostico || e.fechaProcesamiento} | Archivo: ${e.nombreArchivo}
  - Médico Especialista: ${e.datos?.medico_tratante || 'No especificado'} (${e.datos?.especialidad_medico_tratante || 'Especialista'})
  - Diagnóstico: ${e.datos.enfermedad}
  - Cumplimiento de Auditoría: ${e.auditoria.estado} (${e.auditoria.scoreCumplimiento}%)`).join('\n\n')}
================================================================================`;

      carpetaPaciente.file('Resumen_Consolidado_Ambas_Historias.txt', resumenAmbas);
    }
  }

  // 4. Descargar el archivo ZIP organizado
  const blob = await zip.generateAsync({ type: 'blob' });
  const downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download = `${nombreCarpetaInicial}.zip`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  URL.revokeObjectURL(downloadLink.href);
}
