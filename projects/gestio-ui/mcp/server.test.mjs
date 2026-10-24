// Tests du serveur MCP : node --test projects/gestio-ui/mcp/
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const server = join(dirname(fileURLToPath(import.meta.url)), 'server.mjs');

async function session(messages) {
  const child = spawn(process.execPath, [server], { stdio: ['pipe', 'pipe', 'inherit'] });
  let output = '';
  child.stdout.on('data', (chunk) => (output += chunk));
  for (const message of messages) child.stdin.write(JSON.stringify(message) + '\n');
  child.stdin.end();
  await once(child, 'exit');
  return output
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

const init = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'test', version: '1' },
  },
};
const initialized = { jsonrpc: '2.0', method: 'notifications/initialized' };
const call = (id, name, args = {}) => ({
  jsonrpc: '2.0',
  id,
  method: 'tools/call',
  params: { name, arguments: args },
});

test('initialisation, outils et ressources', async () => {
  const [initResult, list, resources] = await session([
    init,
    initialized,
    { jsonrpc: '2.0', id: 2, method: 'tools/list' },
    { jsonrpc: '2.0', id: 3, method: 'resources/list' },
  ]);
  assert.equal(initResult.result.protocolVersion, '2025-06-18');
  assert.equal(initResult.result.serverInfo.name, 'gestio-ui');
  assert.match(initResult.result.instructions, /get_setup_guide/);
  assert.deepEqual(list.result.tools.map((t) => t.name).sort(), [
    'get_component',
    'get_guide',
    'get_setup_guide',
    'list_components',
    'list_design_tokens',
    'search_docs',
  ]);
  assert.ok(list.result.tools.every((t) => t.inputSchema?.type === 'object' && !('run' in t)));
  assert.ok(resources.result.resources.some((r) => r.uri === 'gestio-ui://components/button'));
});

test('get_component privilégie la correspondance exacte', async () => {
  const cases = {
    grid: '# Grille (grid)',
    'gestio-grid': '# Grille (grid)',
    datagrid: '# Datagrid (datagrid)',
    'gestio-table-container': '# Tableau (table)',
    table: '# Tableau (table)',
    GestioGridItem: '# Grille (grid)',
    'gestio-tab': '# Onglets (tabs)',
    'app-shell': "# Coque d'application (app-shell)",
  };
  const names = Object.keys(cases);
  const responses = await session([
    init,
    ...names.map((name, i) => call(i + 2, 'get_component', { name })),
  ]);
  names.forEach((name, i) => {
    const title = responses[i + 1].result.content[0].text.split('\n')[0];
    assert.equal(title, cases[name], `get_component("${name}")`);
  });
});

test('get_component retrouve un composant par id, classe ou sélecteur', async () => {
  const responses = await session([
    init,
    call(2, 'get_component', { name: 'button' }),
    call(3, 'get_component', { name: 'GestioSelect' }),
    call(4, 'get_component', { name: 'gestio-tabs' }),
    call(5, 'get_component', { name: 'datepicker' }),
  ]);
  const [, button, select, tabs, unknown] = responses.map((r) => r.result);
  assert.match(button.content[0].text, /button\[gestioButton\]/);
  assert.match(button.content[0].text, /loading/);
  assert.match(select.content[0].text, /GestioSelectOption/);
  assert.match(tabs.content[0].text, /selectedIndex/);
  assert.equal(unknown.isError, true);
});

test('guides, recherche et design tokens', async () => {
  const [, setup, search, tokens, darkTokens] = (
    await session([
      init,
      call(2, 'get_setup_guide'),
      call(3, 'search_docs', { query: 'mot de passe' }),
      call(4, 'list_design_tokens', { filter: 'color-primary' }),
      call(5, 'list_design_tokens', { filter: 'color-background' }),
    ])
  ).map((r) => r.result?.content?.[0]?.text);
  assert.match(setup, /gestio-ui\.css/);
  assert.match(search, /input/);
  assert.match(tokens, /--gestio-color-primary: var\(--gestio-indigo-600\)/);
  assert.match(darkTokens, /sombre : #0d0f17/);
});

test('erreurs JSON-RPC', async () => {
  const [, unknownMethod, unknownTool, ping] = await session([
    init,
    { jsonrpc: '2.0', id: 2, method: 'prompts/get' },
    { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'nope' } },
    { jsonrpc: '2.0', id: 4, method: 'ping' },
  ]);
  assert.equal(unknownMethod.error.code, -32601);
  assert.equal(unknownTool.error.code, -32602);
  assert.deepEqual(ping.result, {});
});
