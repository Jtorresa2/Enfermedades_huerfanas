# DUSAKAWI EPSI — Módulo de Extracción y Auditoría de Enfermedades Huérfanas

Software especializado para la **Entidad Promotora de Salud Indígena (DUSAKAWI EPSI)**, diseñado para la captura masiva, validación normativa y auditoría clínica de expedientes de **Enfermedades Huérfanas y Raras** bajo los lineamientos del Ministerio de Salud y Protección Social de Colombia, SIVIGILA (Evento 342), la Cuenta de Alto Costo (CAC) y SISPRO / RNPEH.

Desarrollado en **React 18 + TypeScript + Vite**, con un diseño clínico institucional de alta precisión.

---

## 🏛️ Contexto Institucional DUSAKAWI EPSI
- **Poblaciones de cobertura**: Pueblos indígenas *Wayuu, Kankuamo, Yukpa, Wiwa, Arhuaco y Kogui*.
- **Sedes territoriales**: Departamentos del *Cesar, La Guajira y Magdalena*.
- **Módulo de Gestión del Riesgo en Salud**: Diseñado para el equipo de auditoría médica, pertinencia de tecnologías en salud y reporte epidemiológico ante MinSalud y la Cuenta de Alto Costo.

---

## ⚙️ Características Principales

### 1. Regla Estricta de "Cero Inventiva"
- El motor de procesamiento extrae **únicamente** la información explícitamente presente en el documento clínico.
- Si una variable (CIE-10, código CUPS, radicado SIVIGILA o especialista certificador) está ausente, asigna el valor normativo exacto: `"No especificado en el documento"`.

### 2. Esquema de Extracción Estructurado (JSON)
Cada ficha se valida contra el esquema oficial:
```json
{
  "enfermedad": "Nombre oficial de la patología",
  "codigo_cie10": "Código CIE-10 (ej. E75.2, G35X, D66X)",
  "id_oficial_minsalud": "ID Oficial en el listado de Enfermedades Huérfanas",
  "categoria_grupo": "Clasificación o grupo de la patología",
  "definicion": "Resumen técnico de la definición y fisiopatología",
  "criterios_diagnosticos_confirmatorios": [
    "Criterio con código CUPS o prueba Gold Standard"
  ],
  "sintomas_clave": [
    "Manifestación clínica relevante"
  ],
  "normativa_y_respaldo_legal": {
    "listado_oficial": "Resolución o Ley aplicable",
    "requisitos_validacion": [
      "Ficha de notificación SIVIGILA Evento 342",
      "Especialidad médica certificadora"
    ]
  },
  "diagnostico_diferencial": [
    "Patología de exclusión"
  ]
}
```

### 3. Matriz de Control Normativo y Semáforo de Auditoría
- 🟢 **CONFORME**: 100% de cumplimiento (CIE-10 válido, CUPS Gold Standard, SIVIGILA 342 y aval de especialista).
- 🟡 **INCOMPLETO**: Alertas por datos faltantes (requiere subsanar paraclínicos o radicación).
- 🔴 **CRÍTICO**: Sin prueba confirmatoria explícita ni criterio de inclusión.

### 4. Carga Masiva (Batch Processing)
- Soporte para arrastrar y soltar múltiples archivos (PDF, TXT, JSON) o carpetas completas.
- Casos oficiales precargados listos para pruebas con 1 clic:
  - **Enfermedad de Gaucher Tipo 1** (Pueblo Kankuamo, Atánquez, Cesar).
  - **Esclerosis Múltiple Remitente-Recurrente** (Pueblo Wayuu, Mayapo, La Guajira).
  - **Hemofilia A Severa** (Pueblo Yukpa, Codazzi, Cesar).
  - **Fibrosis Quística** (Pueblo Wiwa, Santa Marta, Magdalena).
  - **Caso Incompleto / Alerta Cero Inventiva** (Maicao, La Guajira).

### 5. Exportación Inmediata
- **Excel (.xlsx)**: Hoja 1 (*Resumen Ejecutivo para Auditoría DUSAKAWI EPSI*) y Hoja 2 (*Matriz Nominal Consolidada con columnas formateadas y anchos ajustados*).
- **JSON**: Descarga estructurada para interoperabilidad con sistemas de información de SISPRO.

### 6. Integración en la Nube
- Guía y simulador para conectar carpetas de **Google Drive** (`/Fichas_Entrada/`) mediante automatizaciones en **Make.com** o **N8N**.
- Soporte opcional para ingresar tu clave de **Google Gemini API** para procesamiento en vivo con IA.

---

## 🚀 Cómo Iniciar el Software

### 1. Ubicación del Proyecto
El proyecto está ubicado en tu carpeta:
```bash
C:\Users\SISTEMAS\Documents\dusakawi\dusakawi_enfermedadeshuerfanas
```

### 2. Ejecutar localmente
Abre una terminal PowerShell en esa carpeta y ejecuta:
```bash
npm run dev
```

Abre tu navegador en:
```
http://localhost:5173
```

### 3. Compilar para Producción
```bash
npm run build
```
Genera la carpeta `dist/` optimizada y lista para despliegue en servidor web.
