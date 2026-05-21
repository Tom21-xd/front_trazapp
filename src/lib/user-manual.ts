/**
 * Genera el manual de usuario en PDF con jsPDF + autoTable.
 * Imports dinámicos para que el bundle inicial no cargue jsPDF.
 */

interface Section {
  title: string;
  /** Cada item: párrafo o lista de viñetas */
  blocks: Array<
    | { kind: 'p'; text: string }
    | { kind: 'ul'; items: string[] }
    | { kind: 'h3'; text: string }
  >;
}

const SECTIONS: Section[] = [
  {
    title: '1. Introducción',
    blocks: [
      {
        kind: 'p',
        text: 'TrazApp es la plataforma institucional de la Alcaldía de Florencia para gestionar proyectos, actividades y su trazabilidad completa. Este manual explica el uso por rol y los flujos diarios. Para una guía interactiva, usa el botón "?" del menú superior.',
      },
      { kind: 'h3', text: 'Roles del sistema' },
      {
        kind: 'ul',
        items: [
          'Administrador: acceso total, gestiona usuarios, roles, etapas, etiquetas y catálogos.',
          'Supervisor: gestiona proyectos y actividades, aprueba o rechaza solicitudes de cambio, asigna usuarios.',
          'Trabajador: ve sus actividades asignadas, comenta, adjunta archivos y solicita cambios de etapa.',
        ],
      },
    ],
  },
  {
    title: '2. Inicio de sesión',
    blocks: [
      {
        kind: 'p',
        text: 'Ingresa con tu correo institucional y contraseña en la pantalla de login. Si olvidaste la contraseña, pulsa "¿Olvidaste tu contraseña?" y recibirás un correo con un enlace para restablecerla (válido 1 hora).',
      },
      {
        kind: 'p',
        text: 'Tras varios intentos fallidos el sistema aplica rate limit (5 intentos por minuto) para proteger las cuentas.',
      },
    ],
  },
  {
    title: '3. Dashboard',
    blocks: [
      {
        kind: 'p',
        text: 'El Dashboard muestra tu vista resumen al ingresar. Indicadores principales (KPIs):',
      },
      {
        kind: 'ul',
        items: [
          'Mis pendientes: actividades asignadas a ti, no completadas.',
          'Vencidas: actividades con fecha límite ya pasada.',
          'Sin asignar (admin/supervisor): actividades activas sin responsable.',
          'Solicitudes por revisar (admin/supervisor): cambios de etapa pendientes de aprobación.',
        ],
      },
      {
        kind: 'p',
        text: 'Distribución por etapa: barra apilada con el conteo de actividades activas por cada etapa del flujo, útil para detectar cuellos de botella.',
      },
      {
        kind: 'p',
        text: 'Carga por prioridad: cuántas actividades abiertas hay en cada nivel (Urgente, Alta, Media, Baja).',
      },
      {
        kind: 'p',
        text: 'Próximas a vencer: actividades con vencimiento en los próximos 7 días, ordenadas cronológicamente.',
      },
    ],
  },
  {
    title: '4. Tablero Kanban',
    blocks: [
      {
        kind: 'p',
        text: 'El tablero muestra las actividades organizadas en columnas (etapas del flujo). Cada tarjeta es clickeable y abre el detalle.',
      },
      { kind: 'h3', text: 'Mover entre etapas' },
      {
        kind: 'ul',
        items: [
          'Administrador y supervisor: arrastrar y soltar la tarjeta entre columnas. El cambio es inmediato.',
          'Trabajador: arrastrar genera automáticamente una solicitud de cambio de etapa que debe aprobar un supervisor.',
        ],
      },
      { kind: 'h3', text: 'Filtros' },
      {
        kind: 'p',
        text: 'Buscador (por título o descripción), filtro por proyecto, asignado y prioridad. Los filtros se guardan localmente entre sesiones. En móvil pulsa el botón "Filtros" para desplegar los selects.',
      },
      { kind: 'h3', text: 'Añadir tarea' },
      {
        kind: 'p',
        text: 'Pulsa "Añadir tarea" al final de cualquier columna para crear una actividad directamente en esa etapa. Si tienes permiso de asignar, puedes elegir responsables desde el mismo formulario.',
      },
    ],
  },
  {
    title: '5. Detalle de actividad',
    blocks: [
      { kind: 'h3', text: 'Cabecera (hero)' },
      {
        kind: 'p',
        text: 'Título, prioridad, fecha límite, número de asignados y quién la creó. La franja izquierda toma el color de la etapa actual.',
      },
      { kind: 'h3', text: 'Flujo de etapas' },
      {
        kind: 'p',
        text: 'Todas las etapas del flujo en línea, con la actual destacada. Botón "Solicitar cambio" abre el formulario.',
      },
      { kind: 'h3', text: 'Descripción' },
      {
        kind: 'p',
        text: 'Contexto, criterios o pasos. Botón "Editar" (con permiso) abre el modal para modificar título, descripción, prioridad, fecha límite, etiquetas y dependencias.',
      },
      { kind: 'h3', text: 'Comentarios' },
      {
        kind: 'p',
        text: 'Conversación cronológica. Al pasar el mouse sobre tu comentario aparecen los botones para editar y eliminar (gated por permisos). Puedes adjuntar archivos al comentario.',
      },
      { kind: 'h3', text: 'Adjuntos' },
      {
        kind: 'p',
        text: 'Archivos directos de la actividad. Las imágenes se ven como thumbnails y se abren en lightbox; los demás archivos se descargan al click.',
      },
      { kind: 'h3', text: 'Solicitudes de cambio de etapa' },
      {
        kind: 'p',
        text: 'Lista las solicitudes asociadas. Los revisores ven botones Aprobar/Rechazar inline; el solicitante puede Cancelar mientras siga pendiente.',
      },
      { kind: 'h3', text: 'Trazabilidad' },
      {
        kind: 'p',
        text: 'Timeline inmutable con quién hizo qué y cuándo. Filtros por tipo (etapas, asignaciones, comentarios, cambios y archivos). Exporta a CSV o PDF para auditoría.',
      },
      { kind: 'h3', text: 'Sidebar' },
      {
        kind: 'p',
        text: 'Asignados (con botón Gestionar para admin), etiquetas, dependencias y un resumen de creación y última actividad.',
      },
      { kind: 'h3', text: 'Archivar (soft delete)' },
      {
        kind: 'p',
        text: 'El botón "Archivar" marca la actividad como inactiva pero conserva todo el historial para auditoría. La actividad deja de aparecer en listados y no admite cambios; un banner amarillo lo indica.',
      },
    ],
  },
  {
    title: '6. Calendario',
    blocks: [
      {
        kind: 'p',
        text: 'Grid mensual con las actividades que tienen fecha límite. Cada día muestra un conteo y, en pantalla amplia, los títulos truncados (en móvil sólo puntos coloreados por prioridad). Click en un día para ver el detalle a la derecha.',
      },
      {
        kind: 'p',
        text: 'Días con actividades vencidas se marcan con badge rojo. El día actual aparece con fondo verde.',
      },
    ],
  },
  {
    title: '7. Notificaciones',
    blocks: [
      {
        kind: 'p',
        text: 'La campana del menú superior muestra el contador de notificaciones sin leer y, al abrirse, las últimas 10. Las notificaciones llegan en tiempo real por SSE (no necesitas refrescar).',
      },
      { kind: 'h3', text: 'Canales' },
      {
        kind: 'ul',
        items: [
          'In-app: la campana del topbar.',
          'Push del dispositivo: activa el toggle "Notificaciones del dispositivo" dentro de la campana para recibir alertas en el celular incluso con la app cerrada.',
          'Correo: cada notificación se envía también al correo institucional.',
        ],
      },
    ],
  },
  {
    title: '8. Mis tareas',
    blocks: [
      {
        kind: 'p',
        text: 'Vista filtrada de las actividades asignadas a ti, agrupadas por prioridad y con sección destacada de "Vencidas". Buscador, filtros por etapa y por prioridad, y checkbox para ocultar las completadas.',
      },
    ],
  },
  {
    title: '9. Solicitudes de cambio de etapa',
    blocks: [
      {
        kind: 'p',
        text: 'Como trabajador, lista tus solicitudes. Como supervisor/admin, lista las pendientes de revisar.',
      },
      {
        kind: 'ul',
        items: [
          'Aprobar: confirma el cambio y mueve la actividad a la etapa solicitada.',
          'Rechazar: deja la actividad en su etapa y registra el motivo del revisor.',
          'Cancelar: el propio solicitante (o un manager con permiso) puede cancelar mientras esté pendiente.',
        ],
      },
    ],
  },
  {
    title: '10. Auditoría (admin)',
    blocks: [
      {
        kind: 'p',
        text: 'Registro inmutable de todas las mutaciones del sistema (creaciones, ediciones, eliminaciones, logins). Cada fila se puede expandir para ver el payload sanitizado y la IP de origen.',
      },
    ],
  },
  {
    title: '11. Catálogos y administración',
    blocks: [
      {
        kind: 'ul',
        items: [
          'Usuarios: crear, activar/desactivar, asignar rol.',
          'Roles y permisos: catálogo de 46 permisos atómicos con alcance own/any. Crea roles personalizados marcando capacidades específicas.',
          'Etapas: configura las columnas del Kanban (nombre, orden, color).',
          'Etiquetas: clasifica actividades y proyectos.',
          'Tipos de proyecto: categorías de alto nivel.',
        ],
      },
    ],
  },
  {
    title: '12. Atajos y trucos',
    blocks: [
      {
        kind: 'ul',
        items: [
          'Instala TrazApp como app desde el navegador (icono "Instalar" en barra de direcciones o "Añadir a pantalla de inicio" en iOS).',
          'Esc cierra cualquier modal abierto.',
          'Los filtros del tablero se guardan en localStorage; al volver al tablero los recuperas automáticamente.',
          'Driver.js: los tours interactivos se autoarrancan la primera vez que entras a cada página; reabrelos desde el botón "?" del menú superior.',
          'Sin conexión: un banner negro aparece en la parte superior cuando se pierde la red; los cambios no se guardan hasta volver online.',
        ],
      },
    ],
  },
];

export async function generateUserManualPdf() {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 48;
  const marginTop = 60;
  const marginBottom = 60;
  const lineHeight = 14;
  const sectionGap = 18;
  let y = marginTop;

  function ensureSpace(needed: number) {
    if (y + needed > pageH - marginBottom) {
      doc.addPage();
      y = marginTop;
    }
  }

  function drawHeader() {
    doc.setFillColor(0, 146, 63);
    doc.rect(0, 0, pageW, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TrazApp · Manual de Usuario', marginX, 26);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Alcaldía de Florencia', pageW - marginX, 26, { align: 'right' });
  }

  function drawFooter() {
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(115, 115, 115);
      doc.text(`Página ${i} de ${total}`, pageW - marginX, pageH - 24, {
        align: 'right',
      });
      doc.text(
        `Generado: ${new Date().toLocaleString('es-CO')}`,
        marginX,
        pageH - 24,
      );
    }
  }

  // Portada
  drawHeader();
  doc.setTextColor(23, 23, 23);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  y = 140;
  doc.text('Manual de Usuario', marginX, y);
  y += 28;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(82, 82, 82);
  doc.text('Sistema TrazApp · Alcaldía de Florencia', marginX, y);
  y += 18;
  doc.setFontSize(10);
  doc.text(
    'Esta guía complementa los tours interactivos en pantalla (botón "?" del menú superior).',
    marginX,
    y,
  );
  y += sectionGap * 2;

  // Tabla de contenidos
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(23, 23, 23);
  doc.text('Contenido', marginX, y);
  y += lineHeight + 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(64, 64, 64);
  for (const s of SECTIONS) {
    ensureSpace(lineHeight);
    doc.text(s.title, marginX + 12, y);
    y += lineHeight;
  }

  // Secciones
  for (const section of SECTIONS) {
    doc.addPage();
    drawHeader();
    y = marginTop;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(0, 116, 47);
    doc.text(section.title, marginX, y);
    y += lineHeight + 8;

    doc.setTextColor(38, 38, 38);
    for (const block of section.blocks) {
      if (block.kind === 'h3') {
        ensureSpace(lineHeight * 2);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(block.text, marginX, y);
        y += lineHeight + 2;
      } else if (block.kind === 'p') {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(block.text, pageW - marginX * 2);
        for (const line of lines) {
          ensureSpace(lineHeight);
          doc.text(line, marginX, y);
          y += lineHeight;
        }
        y += 4;
      } else if (block.kind === 'ul') {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        for (const item of block.items) {
          const lines = doc.splitTextToSize(
            item,
            pageW - marginX * 2 - 14,
          );
          ensureSpace(lineHeight * lines.length);
          doc.text('•', marginX, y);
          for (let i = 0; i < lines.length; i++) {
            doc.text(lines[i], marginX + 14, y);
            y += lineHeight;
          }
        }
        y += 4;
      }
    }
  }

  drawFooter();
  doc.save('TrazApp-Manual-de-Usuario.pdf');
}
