#!/usr/bin/env node
/**
 * Serveur MCP (Model Context Protocol) de @gestiolabs/ui.
 *
 * Donne aux assistants IA la documentation exacte de la bibliothèque installée :
 * composants, entrées, exemples, pièges, guides et design tokens.
 *
 * Transport stdio (JSON-RPC 2.0, un message par ligne), sans dépendance.
 * Lancement : npx gestio-ui-mcp
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';

const here = dirname(fileURLToPath(import.meta.url));
const catalog = JSON.parse(readFileSync(join(here, 'catalog.json'), 'utf8'));

/** Version du paquet installé (dist) ou du workspace (sources). */
function readVersion() {
  for (const file of [join(here, '../package.json')]) {
    try {
      return JSON.parse(readFileSync(file, 'utf8')).version ?? '0.0.0';
    } catch {}
  }
  return '0.0.0';
}

/** Feuille de thème : dist (../styles) ou sources (../src/styles). */
function readThemeCss() {
  for (const file of [
    join(here, '../styles/gestio-ui.css'),
    join(here, '../src/styles/gestio-ui.css'),
  ]) {
    if (existsSync(file)) return readFileSync(file, 'utf8');
  }
  return '';
}

const VERSION = readVersion();
const SUPPORTED_PROTOCOLS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];

// ---------------------------------------------------------------------------
// Connaissances
// ---------------------------------------------------------------------------

/** Extrait les tokens du thème clair et leurs valeurs en thème sombre. */
export function parseTokens(css) {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const blockFor = (selectorStart) => {
    const index = stripped.indexOf(selectorStart);
    if (index === -1) return '';
    const open = stripped.indexOf('{', index);
    let depth = 0;
    for (let i = open; i < stripped.length; i++) {
      if (stripped[i] === '{') depth++;
      else if (stripped[i] === '}' && --depth === 0) return stripped.slice(open + 1, i);
    }
    return '';
  };
  const declarations = (block) => {
    const map = new Map();
    for (const match of block.matchAll(/(--gestio-[\w-]+)\s*:\s*([^;]+);/g)) {
      map.set(match[1], match[2].replace(/\s+/g, ' ').trim());
    }
    return map;
  };
  const light = declarations(blockFor(':root,'));
  const dark = declarations(blockFor("[data-gestio-theme='dark'] {"));
  return [...light.entries()].map(([name, value]) => ({
    name,
    light: value,
    ...(dark.has(name) ? { dark: dark.get(name) } : {}),
  }));
}

const normalize = (text) => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function findComponent(name) {
  const key = normalize(String(name ?? '').trim()).replace(/^gestio-?/, '');
  return catalog.components.find(
    (c) =>
      c.id === key ||
      normalize(c.title) === key ||
      c.exports.some((e) => normalize(e) === normalize(String(name))) ||
      c.classes?.some((k) => normalize(k.selector).includes(key)),
  );
}

function formatComponent(c) {
  const lines = [`# ${c.title} (${c.id})`, '', c.summary, ''];
  lines.push(
    `Import : import { ${c.exports.filter((e) => /^[A-Z]/.test(e) && !/^Gestio\w*(Variant|Size|Type|Value|Appearance|Padding|Position)$/.test(e)).join(', ')} } from '@gestiolabs/ui';`,
  );
  if (c.classes?.length) {
    lines.push('', '## Sélecteurs');
    for (const k of c.classes) lines.push(`- ${k.class} : \`${k.selector}\``);
  }
  if (c.forms) lines.push('', '## Formulaires', c.forms);
  if (c.api) lines.push('', '## API', c.api);
  if (c.configOptions?.length) {
    lines.push('', '## Options de configuration');
    for (const o of c.configOptions)
      lines.push(
        `- \`${o.name}\`: ${o.type}${o.default ? ` = ${o.default}` : ''} — ${o.description}`,
      );
  }
  if (c.inputs?.length) {
    lines.push('', '## Entrées');
    for (const i of c.inputs)
      lines.push(
        `- \`${i.name}\`: ${i.type}${i.default ? ` = ${i.default}` : ''} — ${i.description}`,
      );
  }
  if (c.outputs?.length) {
    lines.push('', '## Sorties');
    for (const o of c.outputs) lines.push(`- \`(${o.name})\`: ${o.type} — ${o.description}`);
  }
  if (c.slots?.length) {
    lines.push('', '## Zones de projection');
    for (const s of c.slots) lines.push(`- \`${s.selector}\` — ${s.description}`);
  }
  if (c.examples?.length) {
    lines.push('', '## Exemples');
    for (const e of c.examples) lines.push(`### ${e.title}`, '```', e.code, '```');
  }
  if (c.pitfalls?.length) {
    lines.push('', '## Pièges à éviter');
    for (const p of c.pitfalls) lines.push(`- ${p}`);
  }
  return lines.join('\n');
}

function formatGuide(g) {
  return `# ${g.title}\n\n${g.content}`;
}

function search(query, limit = 8) {
  const terms = normalize(String(query ?? ''))
    .split(/\s+/)
    .filter((t) => t.length > 1);
  if (!terms.length) return [];
  const docs = [
    ...catalog.components.map((c) => ({
      type: 'component',
      id: c.id,
      title: c.title,
      text: formatComponent(c),
    })),
    ...catalog.guides.map((g) => ({
      type: 'guide',
      id: g.id,
      title: g.title,
      text: formatGuide(g),
    })),
  ];
  return docs
    .map((doc) => {
      const text = normalize(doc.text);
      const title = normalize(doc.title + ' ' + doc.id);
      let score = 0;
      for (const term of terms) {
        if (title.includes(term)) score += 10;
        score += Math.min(text.split(term).length - 1, 10);
      }
      return { ...doc, score };
    })
    .filter((doc) => doc.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((doc) => {
      const text = doc.text;
      const at = normalize(text).indexOf(terms[0]);
      const start = Math.max(0, at - 120);
      return {
        type: doc.type,
        id: doc.id,
        title: doc.title,
        excerpt: (start > 0 ? '…' : '') + text.slice(start, start + 360).replace(/\s+/g, ' ') + '…',
      };
    });
}

// ---------------------------------------------------------------------------
// Outils MCP
// ---------------------------------------------------------------------------

const text = (value) => ({ content: [{ type: 'text', text: value }] });
const failure = (message) => ({ content: [{ type: 'text', text: message }], isError: true });

const tools = [
  {
    name: 'get_setup_guide',
    title: 'Mise en place de @gestiolabs/ui',
    description:
      "Explique comment installer et configurer gestio-ui dans un projet Angular (thème CSS, imports, notifications, modales). À appeler avant d'utiliser la bibliothèque.",
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
    run: () =>
      text(
        ['setup', 'forms', 'accessibility', 'limits']
          .map((id) => formatGuide(catalog.guides.find((g) => g.id === id)))
          .join('\n\n---\n\n'),
      ),
  },
  {
    name: 'list_components',
    title: 'Lister les composants',
    description:
      'Liste les composants et services de @gestiolabs/ui avec leur sélecteur et un résumé.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true },
    run: () =>
      text(
        catalog.components
          .map(
            (c) =>
              `- ${c.id} — ${c.title} [${c.kind}] ${c.classes?.map((k) => '`' + k.selector + '`').join(', ') ?? ''}\n  ${c.summary}`,
          )
          .join('\n') + '\n\nDétails : get_component({ name }).',
      ),
  },
  {
    name: 'get_component',
    title: "Documentation d'un composant",
    description:
      "Retourne la documentation complète d'un composant ou service gestio-ui : import, sélecteurs, entrées (types et valeurs par défaut), sorties, zones de projection, exemples et pièges. Accepte l'id (button, input, select, dialog, toast, tabs, table, datagrid…), le titre ou le nom de classe.",
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Ex. "button", "GestioSelect", "gestio-tabs".' },
      },
      required: ['name'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    run: ({ name }) => {
      const component = findComponent(name);
      if (!component)
        return failure(
          `Composant inconnu : ${name}. Disponibles : ${catalog.components.map((c) => c.id).join(', ')}. Voir aussi le guide « limits ».`,
        );
      return text(formatComponent(component));
    },
  },
  {
    name: 'get_guide',
    title: 'Guide thématique',
    description: `Retourne un guide : ${catalog.guides.map((g) => `${g.id} (${g.title})`).join(', ')}.`,
    inputSchema: {
      type: 'object',
      properties: { topic: { type: 'string', enum: catalog.guides.map((g) => g.id) } },
      required: ['topic'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    run: ({ topic }) => {
      const guide = catalog.guides.find((g) => g.id === topic);
      return guide ? text(formatGuide(guide)) : failure(`Guide inconnu : ${topic}.`);
    },
  },
  {
    name: 'search_docs',
    title: 'Rechercher dans la documentation',
    description:
      'Recherche plein texte dans la documentation des composants et les guides de @gestiolabs/ui.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Ex. "mot de passe", "fermeture échap", "tri".' },
      },
      required: ['query'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    run: ({ query }) => {
      const results = search(query);
      return text(
        results.length
          ? results.map((r) => `- [${r.type}] ${r.id} — ${r.title}\n  ${r.excerpt}`).join('\n')
          : 'Aucun résultat. Essayez list_components ou get_guide({ topic: "limits" }).',
      );
    },
  },
  {
    name: 'list_design_tokens',
    title: 'Design tokens',
    description:
      'Liste les variables CSS --gestio-* du thème installé, avec leur valeur claire et sombre. Filtre facultatif (ex. "color-primary", "space", "radius").',
    inputSchema: {
      type: 'object',
      properties: { filter: { type: 'string' } },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true },
    run: ({ filter } = {}) => {
      const tokens = parseTokens(readThemeCss()).filter(
        (t) => !filter || t.name.includes(String(filter)),
      );
      if (!tokens.length)
        return failure('Aucun token trouvé (thème introuvable ou filtre trop restrictif).');
      return text(
        tokens
          .map((t) => `${t.name}: ${t.light}${t.dark ? `  (sombre : ${t.dark})` : ''}`)
          .join('\n') +
          '\n\nSurcharger dans une feuille chargée après gestio-ui.css ; thème sombre via data-gestio-theme="dark" sur <html>.',
      );
    },
  },
];

// ---------------------------------------------------------------------------
// Ressources MCP
// ---------------------------------------------------------------------------

const resources = [
  ...catalog.guides.map((g) => ({
    uri: `gestio-ui://guides/${g.id}`,
    name: `guide-${g.id}`,
    title: g.title,
    mimeType: 'text/markdown',
    read: () => formatGuide(g),
  })),
  ...catalog.components.map((c) => ({
    uri: `gestio-ui://components/${c.id}`,
    name: `component-${c.id}`,
    title: c.title,
    mimeType: 'text/markdown',
    read: () => formatComponent(c),
  })),
];

const INSTRUCTIONS = `${catalog.summary}
Avant d'écrire du code avec gestio-ui : appeler get_setup_guide, puis get_component pour chaque composant utilisé. N'utiliser que les entrées documentées ; pour un besoin non couvert, consulter get_guide({ topic: "limits" }) plutôt que d'inventer une API.`;

// ---------------------------------------------------------------------------
// JSON-RPC
// ---------------------------------------------------------------------------

export function handle(message) {
  const { id, method, params = {} } = message;
  const isRequest = id !== undefined && id !== null;
  const reply = (result) => (isRequest ? { jsonrpc: '2.0', id, result } : null);
  const error = (code, msg) =>
    isRequest ? { jsonrpc: '2.0', id, error: { code, message: msg } } : null;

  switch (method) {
    case 'initialize': {
      const requested = params.protocolVersion;
      return reply({
        protocolVersion: SUPPORTED_PROTOCOLS.includes(requested)
          ? requested
          : SUPPORTED_PROTOCOLS[0],
        capabilities: { tools: {}, resources: {} },
        serverInfo: { name: 'gestio-ui', title: 'Gestio UI', version: VERSION },
        instructions: INSTRUCTIONS,
      });
    }
    case 'ping':
      return reply({});
    case 'tools/list':
      return reply({ tools: tools.map(({ run, ...definition }) => definition) });
    case 'tools/call': {
      const tool = tools.find((t) => t.name === params.name);
      if (!tool) return error(-32602, `Outil inconnu : ${params.name}`);
      try {
        return reply(tool.run(params.arguments ?? {}));
      } catch (e) {
        return reply(failure(`Erreur : ${e instanceof Error ? e.message : String(e)}`));
      }
    }
    case 'resources/list':
      return reply({ resources: resources.map(({ read, ...definition }) => definition) });
    case 'resources/templates/list':
      return reply({ resourceTemplates: [] });
    case 'resources/read': {
      const resource = resources.find((r) => r.uri === params.uri);
      if (!resource) return error(-32002, `Ressource introuvable : ${params.uri}`);
      return reply({
        contents: [{ uri: resource.uri, mimeType: resource.mimeType, text: resource.read() }],
      });
    }
    default:
      if (!isRequest || method?.startsWith('notifications/')) return null;
      return error(-32601, `Méthode non prise en charge : ${method}`);
  }
}

const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url).toLowerCase() ===
    (await import('node:fs')).realpathSync(process.argv[1]).toLowerCase();

if (isMain) {
  const rl = createInterface({ input: process.stdin });
  rl.on('line', (line) => {
    if (!line.trim()) return;
    let response;
    try {
      const message = JSON.parse(line);
      response = Array.isArray(message) ? message.map(handle).filter(Boolean) : handle(message);
      if (Array.isArray(response) && !response.length) response = null;
    } catch {
      response = { jsonrpc: '2.0', id: null, error: { code: -32700, message: 'JSON invalide' } };
    }
    if (response) process.stdout.write(JSON.stringify(response) + '\n');
  });
  rl.on('close', () => process.exit(0));
}
