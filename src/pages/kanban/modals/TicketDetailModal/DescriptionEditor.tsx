import React, { useRef, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
interface Props {
  value: string;
  onChange: (v: string) => void;
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

const EMOJIS: [string, string][] = [
  // Caras / emociones
  ['😀', 'feliz'], ['😃', 'sonrisa'], ['😄', 'cara feliz'], ['😁', 'dientes'], ['😆', 'risa'], ['😅', 'sudor'], ['😂', 'llanto risa'], ['🤣', 'carcajada'],
  ['😊', 'rubor'], ['😇', 'angelito halo'], ['🙂', 'leve sonrisa'], ['🙃', 'boca abajo'], ['😉', 'guiño'], ['😌', 'alivio'], ['😍', 'enamorado ojos corazón'], ['🥰', 'amor corazones'],
  ['😘', 'beso'], ['😗', 'beso labios'], ['😙', 'beso sonrisa'], ['😚', 'beso mejilla'], ['😋', 'rico rico'], ['😛', 'lengua'], ['😜', 'guiño lengua'], ['🤪', 'loco'],
  ['😝', 'lengua ojos'], ['🤑', 'dinero lengua'], ['🤗', 'abrazo'], ['🤭', 'oops sorpresa'], ['🤫', 'silencio shh'], ['🤔', 'pensando'], ['🤐', 'boca cerrada'], ['🤨', 'ceja levantada'],
  ['😐', 'neutral'], ['😑', 'sin expresion'], ['😶', 'sin boca'], ['😏', 'pícaro'], ['😒', 'molesto desinterés'], ['🙄', 'ojos arriba'], ['😬', 'muecas dientes'], ['🤥', 'mentira nariz'],
  ['😔', 'triste caído'], ['😪', 'sueño cansado'], ['🤤', 'babear'], ['😴', 'dormido zzz'], ['😷', 'mascarilla enfermo'], ['🤒', 'termómetro enfermo'], ['🤕', 'vendaje herido'], ['🤢', 'náuseas'],
  ['🤮', 'vomitar'], ['🤧', 'estornudar gripe'], ['🥵', 'calor sudor'], ['🥶', 'frío hielo'], ['🥴', 'mareado borracho'], ['😵', 'vértigo mareo'], ['🤯', 'cabeza explotar'], ['🤠', 'cowboy sombrero'],
  ['🥳', 'fiesta celebración'], ['😎', 'gafas sol cool'], ['🤓', 'nerd gafas'], ['🧐', 'monóculo curioso'], ['😕', 'confundido'], ['😟', 'preocupado'], ['🙁', 'triste'], ['☹️', 'cara triste'],
  ['😮', 'sorpresa boca'], ['😯', 'asombro'], ['😲', 'impacto'], ['😳', 'avergonzado rubor'], ['🥺', 'suplica'], ['😦', 'afligido'], ['😧', 'angustiado'], ['😨', 'asustado'],
  ['😰', 'sudor frío miedo'], ['😥', 'decepción'], ['😢', 'llanto'], ['😭', 'llanto fuerte'], ['😱', 'horror grito'], ['😖', 'frustrado'], ['😣', 'dolor'], ['😞', 'decepcionado'],
  ['😓', 'cansancio'], ['😩', 'agotado'], ['😫', 'exhausto'], ['🥱', 'aburrido bostezo'], ['😤', 'enojado vapor'], ['😡', 'furioso rojo'], ['😠', 'enojado'], ['🤬', 'blasfemia palabrotas'],
  ['😈', 'diablo malvado'], ['👿', 'diablo enojado'], ['💀', 'calavera muerte'], ['☠️', 'calavera huesos'], ['💩', 'caca excremento'], ['🤡', 'payaso'], ['👹', 'monstruo ogro'], ['👺', 'demonio japonés'],
  ['👻', 'fantasma'], ['👽', 'alien extraterrestre'], ['👾', 'monstruo pixel'], ['🤖', 'robot'],
  // Gestos / manos
  ['👍', 'ok bien pulgar arriba'], ['👎', 'mal pulgar abajo'], ['👊', 'puño golpe'], ['✊', 'puño'], ['🤛', 'puño izquierda'], ['🤜', 'puño derecha'], ['🤞', 'dedos cruzados suerte'], ['✌️', 'victoria paz'],
  ['🤟', 'rock metal'], ['🤘', 'cuernos rock'], ['👌', 'ok perfecto'], ['🤌', 'perfecto italiano'], ['🤏', 'poco pellizco'], ['👈', 'señala izquierda'], ['👉', 'señala derecha'], ['👆', 'señala arriba'],
  ['👇', 'señala abajo'], ['☝️', 'índice arriba'], ['✋', 'alto mano'], ['🤚', 'mano atrás'], ['🖐️', 'cinco dedos'], ['🖖', 'vulcano saludo'], ['👋', 'hola saludo mano'], ['🤙', 'llámame surf'],
  ['💪', 'músculo fuerza brazo'], ['🦾', 'brazo mecánico'], ['🙌', 'aplausos celebración'], ['👐', 'manos abiertas'], ['🤲', 'palmas arriba'], ['🙏', 'gracias por favor rezar'], ['✍️', 'escribir'],
  ['💅', 'uñas manicura'], ['🤳', 'selfie'], ['👏', 'aplaudir'],
  // Objetos / trabajo
  ['💼', 'maletín trabajo'], ['📁', 'carpeta'], ['📂', 'carpeta abierta'], ['📋', 'portapapeles'], ['📌', 'pin tachuela'], ['📍', 'marcador mapa'], ['📎', 'clip'], ['🖇️', 'clips unidos'],
  ['📏', 'regla'], ['📐', 'escuadra'], ['✂️', 'tijeras cortar'], ['🗂️', 'separadores carpeta'], ['🗃️', 'caja archivos'], ['🗄️', 'archivador'], ['🗑️', 'papelera basura'], ['🔒', 'candado cerrado'],
  ['🔓', 'candado abierto'], ['🔑', 'llave'], ['🗝️', 'llave antigua'], ['🔧', 'llave inglesa herramienta'], ['🔨', 'martillo'], ['⚒️', 'pico martillo'], ['🛠️', 'herramientas'], ['🔩', 'tornillo'],
  ['⚙️', 'engranaje'], ['🖥️', 'monitor computadora'], ['💻', 'laptop portátil'], ['⌨️', 'teclado'], ['🖱️', 'mouse ratón'], ['💾', 'disquete'], ['💿', 'cd disco'], ['📱', 'teléfono celular'],
  ['📞', 'auricular teléfono'], ['☎️', 'teléfono fijo'], ['📡', 'antena satélite'], ['🔭', 'telescopio'], ['🔬', 'microscopio'], ['💊', 'pastilla medicamento'], ['💉', 'jeringa vacuna'],
  ['🩺', 'estetoscopio médico'], ['🩹', 'curita'], ['🧪', 'tubo ensayo'], ['💡', 'idea bombilla'], ['🔦', 'linterna'], ['🔋', 'batería'], ['🔌', 'enchufe'],
  // Naturaleza / animales
  ['🐶', 'perro'], ['🐱', 'gato'], ['🐭', 'ratón'], ['🐹', 'hámster'], ['🐰', 'conejo'], ['🦊', 'zorro'], ['🐻', 'oso'], ['🐼', 'panda'],
  ['🐨', 'koala'], ['🐯', 'tigre'], ['🦁', 'león'], ['🐮', 'vaca'], ['🐷', 'cerdo'], ['🐸', 'rana'], ['🐵', 'mono'], ['🐔', 'pollo'],
  ['🐧', 'pingüino'], ['🐦', 'pájaro'], ['🦆', 'pato'], ['🦅', 'águila'], ['🌸', 'flor cerezo'], ['🌼', 'margarita'], ['🌻', 'girasol'], ['🌺', 'hibisco'],
  ['🌹', 'rosa'], ['🍀', 'trébol suerte'], ['🌿', 'planta hierba'], ['🌱', 'brote planta'], ['🌲', 'árbol pino'], ['🌳', 'árbol'], ['🌴', 'palmera'], ['🌵', 'cactus'],
  ['🍄', 'hongo champiñón'], ['🌊', 'ola mar'], ['🌋', 'volcán'], ['🏔️', 'montaña nevada'], ['⛰️', 'montaña'], ['🌅', 'amanecer'], ['🌄', 'atardecer montaña'], ['🌈', 'arcoiris'],
  // Comida / bebida
  ['🍎', 'manzana roja'], ['🍊', 'naranja'], ['🍋', 'limón'], ['🍇', 'uvas'], ['🍓', 'fresa'], ['🍒', 'cereza'], ['🍑', 'durazno melocotón'], ['🥝', 'kiwi'],
  ['🍉', 'sandía'], ['🍌', 'banana plátano'], ['🥑', 'palta aguacate'], ['🥕', 'zanahoria'], ['🌽', 'maíz choclo'], ['🍕', 'pizza'], ['🍔', 'hamburguesa'], ['🌮', 'taco'],
  ['🌯', 'burrito wrap'], ['🍜', 'fideos ramen'], ['🍣', 'sushi'], ['🍦', 'helado'], ['☕', 'café'], ['🍵', 'té'], ['🧃', 'jugo'], ['🥤', 'refresco'],
  ['🍺', 'cerveza'], ['🍷', 'vino'], ['🥂', 'brindis copa'], ['🎂', 'torta cumpleaños'], ['🍰', 'pastel'], ['🧁', 'cupcake'], ['🍩', 'dona'], ['🍪', 'galleta'],
  ['🍫', 'chocolate'], ['🍬', 'caramelo'], ['🍭', 'chupetín'],
  // Actividades / deportes
  ['⚽', 'fútbol pelota'], ['🏀', 'básquet'], ['🏈', 'fútbol americano'], ['⚾', 'béisbol'], ['🎾', 'tenis'], ['🏐', 'vóley'], ['🎱', 'billar'], ['🏓', 'ping pong'],
  ['🏸', 'bádminton'], ['🥊', 'guante boxeo'], ['⛷️', 'esquí'], ['🏊', 'nadar'], ['🚴', 'bicicleta ciclismo'], ['🏋️', 'pesas gym'], ['🤸', 'gimnasia'], ['🎯', 'diana blanco'],
  ['🎮', 'joystick videojuegos'], ['🕹️', 'control arcade'], ['🎲', 'dado juego'], ['♟️', 'ajedrez'],
  // Viajes / lugares
  ['🚗', 'auto carro'], ['🚕', 'taxi'], ['🚙', 'camioneta suv'], ['🚌', 'colectivo autobús'], ['🏎️', 'auto carrera'], ['🚓', 'patrullero policía'], ['🚑', 'ambulancia'], ['🚒', 'camión bomberos'],
  ['🚚', 'camión'], ['✈️', 'avión vuelo'], ['🚀', 'cohete nave'], ['🛸', 'ovni platillo'], ['🚢', 'barco'], ['🏠', 'casa hogar'], ['🏢', 'edificio oficina'], ['🏪', 'tienda'],
  ['🏥', 'hospital'], ['🏦', 'banco'], ['⛺', 'carpa camping'], ['🗺️', 'mapa'],
  // Símbolos / señales
  ['✅', 'check ok correcto'], ['❌', 'error incorrecto x'], ['⚠️', 'advertencia peligro'], ['❗', 'exclamación importante'], ['❓', 'pregunta duda'], ['💯', 'cien perfecto'],
  ['🔴', 'círculo rojo'], ['🟠', 'círculo naranja'], ['🟡', 'círculo amarillo'], ['🟢', 'círculo verde'], ['🔵', 'círculo azul'], ['🟣', 'círculo morado'], ['⚫', 'círculo negro'], ['⚪', 'círculo blanco'],
  ['⭐', 'estrella'], ['🌟', 'estrella brillante'], ['✨', 'destellos chispas'], ['💫', 'mareo estrella'], ['🔥', 'fuego calor'], ['💥', 'explosión boom'],
  ['🎉', 'fiesta confeti'], ['🎊', 'celebración'], ['🎈', 'globo'], ['🎀', 'moño lazo'], ['🎁', 'regalo'], ['🏆', 'trofeo campeon'], ['🥇', 'medalla oro primero'], ['🥈', 'plata segundo'], ['🥉', 'bronce tercero'],
  // Flechas
  ['➡️', 'flecha derecha'], ['⬅️', 'flecha izquierda'], ['⬆️', 'flecha arriba'], ['⬇️', 'flecha abajo'],
  ['🔄', 'rotación ciclo'], ['🔁', 'repetir'], ['🔂', 'repetir uno'],
  // Útiles
  ['📅', 'calendario fecha'], ['📆', 'calendario'], ['🗓️', 'agenda'], ['📊', 'gráfico barras'], ['📈', 'subiendo'], ['📉', 'bajando'], ['💰', 'dinero plata'], ['💳', 'tarjeta crédito'],
  ['💎', 'diamante joya'], ['📦', 'caja paquete'], ['📝', 'nota apunte lapiz'], ['📄', 'documento'], ['📜', 'pergamino'],
  ['🔍', 'buscar lupa'], ['🔎', 'lupa zoom'], ['🔗', 'enlace link'], ['🔔', 'campana notificación'], ['🔕', 'silencio sin notificación'], ['🔊', 'volumen alto'], ['🔇', 'mute silencio'],
  ['💬', 'mensaje chat burbuja'], ['💭', 'pensamiento globo'], ['💤', 'dormir zzz'], ['⏰', 'alarma despertador'], ['⏱️', 'cronómetro'], ['👀', 'ojos mirar'], ['🤝', 'apretón manos acuerdo'],
];

export const DescriptionEditor: React.FC<Props> = ({
  value, onChange, isEditing, onStartEdit, onSave, onCancel,
}) => {
  const descRef = useRef<HTMLTextAreaElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [headingOpen, setHeadingOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [rawView, setRawView] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const closeAllDropdowns = () => {
    setHeadingOpen(false); setMoreOpen(false); setListOpen(false);
    setEmojiOpen(false);
  };

  useEffect(() => {
    const anyOpen = headingOpen || moreOpen || listOpen;
    if (!anyOpen) return;
    const handler = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        closeAllDropdowns();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [headingOpen, moreOpen, listOpen, emojiOpen]);

  const insertAt = (before: string, after = before) => {
    const el = descRef.current; if (!el) return;
    const { selectionStart: s, selectionEnd: e, value: v } = el;
    onChange(v.slice(0, s) + before + v.slice(s, e) + after + v.slice(e));
  };

  const insertMarkdown = (marker: string) => insertAt(marker);

  const applyHeading = (level: number) => {
    const el = descRef.current; if (!el) return;
    const { selectionStart: s, selectionEnd: e, value: v } = el;
    const prefix = level === 0 ? '' : '#'.repeat(level) + ' ';
    const cleared = v.slice(s, e).replace(/^#+\s*/gm, '');
    onChange(v.slice(0, s) + prefix + cleared + v.slice(e));
  };

  const insertBulletedList = () => {
    const el = descRef.current; if (!el) return;
    const { selectionStart: s, selectionEnd: e, value: v } = el;
    const selected = v.slice(s, e);
    const lines = selected ? selected.split('\n').map(l => l.startsWith('- ') ? l : `- ${l}`).join('\n') : '- ';
    onChange(v.slice(0, s) + lines + v.slice(e));
  };

  const insertNumberedList = () => {
    const el = descRef.current; if (!el) return;
    const { selectionStart: s, selectionEnd: e, value: v } = el;
    const selected = v.slice(s, e);
    const lines = selected ? selected.split('\n').map((l, i) => l.match(/^\d+\.\s/) ? l : `${i + 1}. ${l}`).join('\n') : '1. ';
    onChange(v.slice(0, s) + lines + v.slice(e));
  };

  const clearFormatting = () => {
    const el = descRef.current; if (!el) return;
    const { selectionStart: s, selectionEnd: e, value: v } = el;
    const cleared = v.slice(s, e).replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').replace(/~~([^~]+)~~/g, '$1').replace(/`([^`]+)`/g, '$1');
    onChange(v.slice(0, s) + cleared + v.slice(e));
  };


  const insertEmoji = (em: string) => {
    const el = descRef.current; if (!el) return;
    const { selectionStart: s, selectionEnd: e, value: v } = el;
    onChange(v.slice(0, s) + em + v.slice(e));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!e.ctrlKey) return;
    if (e.key === 'b' || e.key === 'B') { e.preventDefault(); insertMarkdown('**'); }
    else if (e.key === 'i' || e.key === 'I') { e.preventDefault(); insertMarkdown('*'); }
    else if (e.key === '/') { e.preventDefault(); setHelpOpen(true); }
    else if (e.key === '\\') { e.preventDefault(); clearFormatting(); }
    else if (e.shiftKey && (e.key === 's' || e.key === 'S')) { e.preventDefault(); insertMarkdown('~~'); }
    else if (e.shiftKey && (e.key === 'm' || e.key === 'M')) { e.preventDefault(); insertMarkdown('`'); }
    else if (e.shiftKey && e.key === '8') { e.preventDefault(); insertBulletedList(); }
    else if (e.shiftKey && e.key === '7') { e.preventDefault(); insertNumberedList(); }
    else if (e.altKey && ['0', '1', '2', '3', '4', '5', '6'].includes(e.key)) {
      e.preventDefault(); applyHeading(parseInt(e.key));
    }
  };

  if (!isEditing) {
    return (
      <div className="mb-4">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="fw-bold text-uppercase text-dark" style={{ fontSize: '0.82rem', letterSpacing: '0.05em' }}>
            <i className="bi bi-justify-left me-1" /> DESCRIPCIÓN
          </div>
          <button className="btn btn-sm btn-outline-secondary px-3 py-1" style={{ fontSize: '0.8rem', fontWeight: 600 }} onClick={onStartEdit}>
            Editar
          </button>
        </div>
        {value ? (
          <div className="cpq-markdown" style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#444' }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          </div>
        ) : (
          <span className="text-muted fst-italic" style={{ fontSize: '0.9rem' }}>Sin descripción.</span>
        )}
      </div>
    );
  }

  const HEADING_LEVELS = [
    { label: 'Texto normal', size: '0.9rem', weight: 400, level: 0, shortcut: 'Ctrl+Alt+0' },
    { label: 'Título 1', size: '1.4rem', weight: 700, level: 1, shortcut: 'Ctrl+Alt+1' },
    { label: 'Título 2', size: '1.2rem', weight: 700, level: 2, shortcut: 'Ctrl+Alt+2' },
    { label: 'Título 3', size: '1.05rem', weight: 700, level: 3, shortcut: 'Ctrl+Alt+3' },
    { label: 'Título 4', size: '0.95rem', weight: 700, level: 4, shortcut: 'Ctrl+Alt+4' },
    { label: 'Título 5', size: '0.85rem', weight: 700, level: 5, shortcut: 'Ctrl+Alt+5' },
    { label: 'Título 6', size: '0.75rem', weight: 700, level: 6, shortcut: 'Ctrl+Alt+6' },
  ];


  return (
    <div className="mb-4">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <div className="fw-bold text-uppercase text-dark" style={{ fontSize: '0.82rem', letterSpacing: '0.05em' }}>
          <i className="bi bi-justify-left me-1" /> DESCRIPCIÓN
        </div>
      </div>

      <div className="border rounded-3 bg-white shadow-sm position-relative" style={{ borderColor: '#dee2e6' }}>
        {/* Toolbar */}
        <div ref={toolbarRef} className="d-flex align-items-center justify-content-between p-2 border-bottom bg-light rounded-top-3" style={{ fontSize: '0.85rem' }}>
          <div className="d-flex align-items-center gap-1 flex-wrap">
            {/* Heading dropdown */}
            <div className="position-relative">
              <button type="button" className="btn btn-sm btn-light border-0 d-flex align-items-center gap-1" style={{ color: '#0d6efd', fontWeight: 600 }}
                onClick={() => { const wasOpen = headingOpen; closeAllDropdowns(); if (!wasOpen) setHeadingOpen(true); }}>
                Tt <i className="bi bi-chevron-down" style={{ fontSize: '0.7rem' }} />
              </button>
              {headingOpen && (
                <div className="position-absolute bg-white border rounded shadow-sm py-1 mt-1" style={{ zIndex: 1060, minWidth: 220, left: 0 }}>
                  {HEADING_LEVELS.map(({ label, size, weight, level, shortcut }) => (
                    <button key={level} type="button"
                      className="dropdown-item px-3 py-2 d-flex justify-content-between align-items-center text-dark"
                      style={{ fontSize: size, fontWeight: weight }}
                      onClick={() => { applyHeading(level); setHeadingOpen(false); }}>
                      <span>{label}</span>
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>{shortcut}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="vr mx-1" style={{ height: 18 }} />

            <button type="button" className="btn btn-sm btn-light border-0 fw-bold" onClick={() => insertMarkdown('**')} title="Negrita (Ctrl+B)">B</button>
            <button type="button" className="btn btn-sm btn-light border-0 fst-italic" onClick={() => insertMarkdown('*')} title="Cursiva (Ctrl+I)">I</button>

            {/* More formats */}
            <div className="position-relative">
              <button type="button" className="btn btn-sm btn-light border-0"
                onClick={() => { const wasOpen = moreOpen; closeAllDropdowns(); if (!wasOpen) setMoreOpen(true); }}>
                <i className="bi bi-three-dots" />
              </button>
              {moreOpen && (
                <div className="position-absolute bg-white border rounded shadow-sm py-1 mt-1" style={{ zIndex: 1060, minWidth: 200, left: 0 }}>
                  <button type="button" className="dropdown-item px-3 py-2 d-flex justify-content-between text-dark" style={{ fontSize: '0.85rem' }} onClick={() => { insertMarkdown('~~'); setMoreOpen(false); }}><span>Tachado</span><span className="text-muted" style={{ fontSize: '0.75rem' }}>Ctrl+Shift+S</span></button>
                  <button type="button" className="dropdown-item px-3 py-2 d-flex justify-content-between text-dark" style={{ fontSize: '0.85rem' }} onClick={() => { insertMarkdown('`'); setMoreOpen(false); }}><span>Código</span><span className="text-muted" style={{ fontSize: '0.75rem' }}>Ctrl+Shift+M</span></button>
                  <hr className="my-1" />
                  <button type="button" className="dropdown-item px-3 py-2 d-flex justify-content-between text-dark" style={{ fontSize: '0.85rem' }} onClick={() => { clearFormatting(); setMoreOpen(false); }}><span className="text-muted">Borrar formato</span><span className="text-muted" style={{ fontSize: '0.75rem' }}>Ctrl+\</span></button>
                </div>
              )}
            </div>

            <div className="vr mx-1" style={{ height: 18 }} />

            {/* List formats */}
            <div className="position-relative">
              <button type="button" className="btn btn-sm btn-light border-0 d-flex align-items-center gap-1"
                onClick={() => { const wasOpen = listOpen; closeAllDropdowns(); if (!wasOpen) setListOpen(true); }}>
                <i className="bi bi-list-task" /> <i className="bi bi-chevron-down" style={{ fontSize: '0.7rem' }} />
              </button>
              {listOpen && (
                <div className="position-absolute bg-white border rounded shadow-sm py-1 mt-1" style={{ zIndex: 1060, minWidth: 200, left: 0 }}>
                  <button type="button" className="dropdown-item px-3 py-2 d-flex justify-content-between text-dark" style={{ fontSize: '0.85rem' }} onClick={() => { insertBulletedList(); setListOpen(false); }}><span>Lista de viñetas</span><span className="text-muted" style={{ fontSize: '0.75rem' }}>Ctrl+Shift+8</span></button>
                  <button type="button" className="dropdown-item px-3 py-2 d-flex justify-content-between text-dark" style={{ fontSize: '0.85rem' }} onClick={() => { insertNumberedList(); setListOpen(false); }}><span>Lista numerada</span><span className="text-muted" style={{ fontSize: '0.75rem' }}>Ctrl+Shift+7</span></button>
                </div>
              )}
            </div>

            <div className="vr mx-1" style={{ height: 18 }} />

            {/* Emoji */}
            <div className="position-relative">
              <button type="button" className="btn btn-sm btn-light border-0" title="Emoji"
                onClick={() => { const wasOpen = emojiOpen; closeAllDropdowns(); if (!wasOpen) setEmojiOpen(true); }}>
                <i className="bi bi-emoji-smile" style={{ fontSize: '1rem', color: '#f59e0b' }} />
              </button>
              {emojiOpen && (
                <div className="position-absolute bg-white border rounded shadow-sm p-2 mt-1" style={{ zIndex: 1070, left: 0, top: '100%', width: 300 }}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-bold" style={{ fontSize: '0.8rem' }}>Emojis</span>
                    <button type="button" className="btn-close" style={{ fontSize: '0.6rem' }} onClick={() => { setEmojiOpen(false); setEmojiSearch(''); }} />
                  </div>
                  <input
                    type="text"
                    className="form-control form-control-sm mb-2"
                    placeholder="Buscar emoji..."
                    value={emojiSearch}
                    onChange={e => setEmojiSearch(e.target.value)}
                    autoFocus
                  />
                  <div className="d-flex flex-wrap gap-1" style={{ maxHeight: 200, overflowY: 'auto' }}>
                    {EMOJIS
                      .filter(([, name]) => !emojiSearch || name.toLowerCase().includes(emojiSearch.toLowerCase()))
                      .map(([char, name]) => (
                        <button key={char} type="button" className="btn btn-sm btn-light p-1" style={{ fontSize: '1.1rem', width: 32, height: 32 }}
                          title={name} onClick={() => { insertEmoji(char); setEmojiOpen(false); setEmojiSearch(''); }}>{char}</button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="d-flex align-items-center gap-1">
            <button type="button" className={`btn btn-sm ${rawView ? 'btn-primary text-white' : 'btn-light border-0'}`} onClick={() => setRawView(v => !v)} title="Ver Markdown">M↓</button>
            <button type="button" className="btn btn-sm btn-light border-0" onClick={() => setHelpOpen(true)} title="Ayuda"><i className="bi bi-question-circle" /></button>
          </div>
        </div>

        <textarea
          ref={descRef}
          className="form-control form-control-sm border-0 bg-transparent p-3 shadow-none text-dark"
          rows={6}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ fontSize: '0.9rem', minHeight: 160, resize: 'vertical' }}
          placeholder="Escribe una descripción..."
        />


        {rawView && (
          <div className="p-3 border-top bg-light position-relative" style={{ borderBottomLeftRadius: 6, borderBottomRightRadius: 6 }}>
            <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
              <span className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}><i className="bi bi-markdown me-1" /> Formato Markdown</span>
              <div className="d-flex gap-1">
                <button type="button" className="btn btn-sm btn-outline-primary py-0 px-2" style={{ fontSize: '0.75rem' }} onClick={() => navigator.clipboard.writeText(value)}>
                  <i className="bi bi-clipboard me-1" /> Copiar
                </button>
                <button type="button" className="btn btn-sm btn-light py-0 px-1 border-0" onClick={() => setRawView(false)}>
                  <i className="bi bi-x-lg" />
                </button>
              </div>
            </div>
            <pre className="p-3 bg-white rounded border m-0 text-dark" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.82rem', maxHeight: 200, overflowY: 'auto' }}>
              {value || '(Descripción vacía)'}
            </pre>
          </div>
        )}
      </div>

      <div className="d-flex align-items-center gap-3 mt-3">
        <button className="btn btn-primary btn-sm px-4 fw-semibold" style={{ borderRadius: 6 }} onClick={onSave}>Guardar</button>
        <button className="btn btn-sm btn-link text-decoration-none text-secondary p-0 fw-semibold" onClick={onCancel}>Cancelar</button>
      </div>

      {helpOpen && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1080 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 p-4 shadow-lg text-dark" style={{ borderRadius: 16 }}>
              <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
                <span className="fw-bold text-dark fs-5">Ayuda del editor</span>
                <button type="button" className="btn-close" onClick={() => setHelpOpen(false)} />
              </div>
              <div className="row text-start">
                <div className="col-md-6 border-end">
                  <div className="fw-bold text-dark mb-3 fs-6">Métodos abreviados de teclado</div>
                  <div className="d-flex flex-column gap-2" style={{ fontSize: '0.85rem' }}>
                    {[['Borrar formato', 'Ctrl', '\\'], ['Negrita', 'Ctrl', 'B'], ['Cursiva', 'Ctrl', 'I'], ['Tachado', 'Ctrl', 'Shift', 'S'], ['Código en línea', 'Ctrl', 'Shift', 'M'],
                    ['Título 1', 'Ctrl', 'Alt', '1'], ['Título 2', 'Ctrl', 'Alt', '2'], ['Título 3', 'Ctrl', 'Alt', '3'], ['Vincular', 'Ctrl', 'K'],
                    ].map(([label, ...keys]) => (
                      <div key={label} className="d-flex justify-content-between align-items-center py-1">
                        <span className="text-secondary">{label}</span>
                        <div className="d-flex align-items-center gap-1">
                          {keys.map((k, j) => <kbd key={j} className="bg-light text-dark border px-2 small">{k}</kbd>)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="fw-bold text-dark mb-3 fs-6">Markdown</div>
                  <div className="d-flex flex-column gap-2" style={{ fontSize: '0.85rem' }}>
                    {[['Negrita', '**Negrita**'], ['Cursiva', '*Cursiva*'], ['Tachado', '~~Tachado~~'], ['Título 1', '# Space'], ['Título 2', '## Space'],
                    ['Lista de viñetas', '* Space'], ['Lista numerada', '1. Space'], ['Fragmento de código', '```'],
                    ].map(([label, syntax]) => (
                      <div key={label} className="d-flex justify-content-between align-items-center py-1">
                        <span className="text-secondary">{label}</span>
                        <kbd className="bg-light text-dark border px-2 small" style={{ fontFamily: 'monospace' }}>{syntax}</kbd>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-top d-flex justify-content-end">
                <button type="button" className="btn btn-sm btn-outline-secondary px-3" onClick={() => setHelpOpen(false)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
