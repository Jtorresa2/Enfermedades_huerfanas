import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Configurar el worker de PDF.js para Vite
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
} catch (e) {
  console.warn('No se pudo inicializar worker de PDF.js mediante URL, usando fallback:', e);
}

/**
 * Decodificador fallback rápido de streams de PDF en caso de que pdfjs-dist falle
 */
function extraerTextoDeBufferPlano(buffer: ArrayBuffer): string {
  try {
    const decoder = new TextDecoder('latin1');
    const raw = decoder.decode(buffer);
    const regex = /\(([^)]+)\)\s*Tj|\[([^\]]+)\]\s*TJ/g;
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(raw)) !== null) {
      if (match[1]) {
        matches.push(match[1]);
      } else if (match[2]) {
        const inner = match[2].replace(/\(([^)]+)\)/g, '$1 ');
        matches.push(inner);
      }
    }
    return matches.join(' ').replace(/\\([()\\])/g, '$1').trim();
  } catch {
    return '';
  }
}

/**
 * Extrae todo el texto legible de un archivo PDF en el navegador
 */
export async function extraerTextoDePdf(archivo: File | Blob | ArrayBuffer): Promise<string> {
  let arrayBuffer: ArrayBuffer;
  if (archivo instanceof ArrayBuffer) {
    arrayBuffer = archivo;
  } else {
    arrayBuffer = await archivo.arrayBuffer();
  }

  // 1. Intento principal con PDF.js
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
      disableFontFace: true
    });

    const pdf = await loadingTask.promise;
    const paginasTexto: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const textoPagina = content.items
          .map((item: any) => (item.str ? item.str.trim() : ''))
          .filter(Boolean)
          .join(' ');
        paginasTexto.push(textoPagina);
      } catch (pageErr) {
        console.warn(`Error leyendo página ${i} del PDF:`, pageErr);
      }
    }

    const textoCompleto = paginasTexto.join('\n').trim();
    if (textoCompleto.length > 20) {
      return textoCompleto;
    }
  } catch (err) {
    console.warn('PDF.js falló al procesar el archivo, usando extractor de respaldo:', err);
  }

  // 2. Extractor de respaldo por streams planos
  const textoPlano = extraerTextoDeBufferPlano(arrayBuffer);
  return textoPlano;
}
