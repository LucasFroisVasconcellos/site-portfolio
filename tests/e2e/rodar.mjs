// Testes ponta a ponta no navegador (ARQ-002, seção 10.1), contra o servidor local
// que aplica os cabeçalhos do _headers. Uso: npm run test:e2e
// Requer o pacote playwright (npm i -D playwright) e um Chromium instalado.
// CHROMIUM=/caminho/do/chrome para usar um executável específico.

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import assert from 'node:assert/strict';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PORTA = 5199;
const BASE = `http://127.0.0.1:${PORTA}/`;
const resultados = [];

const servidor = spawn(process.execPath, [join(RAIZ, 'scripts/servidor.mjs')], { env: { ...process.env, PORTA: String(PORTA) }, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 600));
const navegador = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});

async function caso(id, nome, fn, opcoes = {}) {
  const contexto = await navegador.newContext({ viewport: { width: 1366, height: 768 }, locale: 'pt-BR', ...opcoes.contexto });
  const pagina = await contexto.newPage();
  const erros = [];
  pagina.on('pageerror', (e) => erros.push(e.message));
  pagina.on('console', (m) => {
    // A API do GitHub pode estar fora do ar no ambiente de teste: esses erros de rede são esperados.
    if (m.type() === 'error' && !/api\.github\.com|Failed to load resource/.test(m.text())) erros.push(m.text());
  });
  await pagina.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
    window.__abertos = [];
    window.open = (...a) => { window.__abertos.push(a); return null; };
  });
  if (opcoes.antes) await opcoes.antes(pagina, contexto);
  try {
    await fn(pagina, contexto);
    const csp = await pagina.evaluate(() => window.__csp).catch(() => []);
    assert.deepEqual(csp, [], `violações de CSP: ${csp.join(', ')}`);
    assert.deepEqual(erros, [], `erros no console: ${erros.join(' | ')}`);
    resultados.push({ id, nome, resultado: 'PASS' });
  } catch (e) {
    resultados.push({ id, nome, resultado: 'FAIL', detalhe: e.message.split('\n')[0] });
  }
  await contexto.close();
}

async function abrirPulando(p) {
  await p.goto(BASE);
  await p.waitForSelector('#btn-pular:not([hidden])', { timeout: 20000 });
  await p.click('#btn-pular');
  await p.waitForFunction(() => document.body.classList.contains('modo-quarto'));
}
const paredeAtual = (p) => p.evaluate(() => document.getElementById('nome-parede').textContent);
const estadoPC = (p) => p.evaluate(() => document.querySelector('.pc').dataset.estado);

await caso('RF-07/RF-09', 'carrega, mostra o passeio e “Pular” leva ao quarto em até 600 ms', async (p) => {
  await p.goto(BASE);
  await p.waitForSelector('#texto-passeio:not([hidden])');
  assert.equal(await p.textContent('#texto-passeio'), 'Quarto interativo');
  const t0 = Date.now();
  await p.click('#btn-pular');
  await p.waitForFunction(() => document.body.classList.contains('modo-quarto'));
  assert.ok(Date.now() - t0 < 600);
  assert.equal(await p.isHidden('#btn-pular'), true);
});

await caso('Passeio-2', 'segunda visita no aparelho não roda o passeio', async (p) => {
  await abrirPulando(p);
  await p.reload();
  await p.waitForFunction(() => document.body.classList.contains('modo-quarto'));
  assert.equal(await p.isHidden('#btn-pular'), true);
});

await caso('RF-03/RNF-13', 'setas da tela e do teclado trocam de parede', async (p) => {
  await abrirPulando(p);
  await p.click('#seta-dir');
  await p.waitForTimeout(500);
  assert.equal(await paredeAtual(p), 'Parede do guarda-roupa');
  await p.keyboard.press('ArrowLeft');
  await p.waitForTimeout(500);
  assert.equal(await paredeAtual(p), 'Parede do PC');
  await p.keyboard.press('ArrowLeft');
  await p.waitForTimeout(500);
  assert.equal(await paredeAtual(p), 'Parede da janela');
});

await caso('RF-02', 'no computador, arrastar com o mouse não muda a parede', async (p) => {
  await abrirPulando(p);
  await p.mouse.move(900, 300);
  await p.mouse.down();
  await p.mouse.move(200, 300, { steps: 8 });
  await p.mouse.up();
  await p.waitForTimeout(500);
  assert.equal(await paredeAtual(p), 'Parede do PC');
});

await caso('RF-05', 'clicar no monitor foca; Esc volta', async (p) => {
  await abrirPulando(p);
  await p.click('[data-item=monitor]', { force: true });
  await p.waitForSelector('#btn-voltar:not([hidden])');
  assert.ok(await p.evaluate(() => document.body.classList.contains('modo-foco')));
  await p.waitForTimeout(700);
  await p.keyboard.press('Escape');
  await p.waitForFunction(() => document.body.classList.contains('modo-quarto'));
});

await caso('RF-06', 'menu “Ir para” leva ao foco da parede de trás só pelo teclado', async (p) => {
  await abrirPulando(p);
  await p.focus('#btn-irpara');
  await p.keyboard.press('Enter');
  await p.waitForSelector('#menu-irpara:not([hidden])');
  for (let i = 0; i < 4; i++) await p.keyboard.press('ArrowDown');
  assert.equal(await p.evaluate(() => document.activeElement.textContent), 'Quadro digital');
  await p.keyboard.press('Enter');
  await p.waitForFunction(() => document.body.classList.contains('modo-foco'));
  assert.equal(await paredeAtual(p), 'Parede de trás');
});

await caso('PC-01/02/03', 'PC começa ligado; gabinete desliga em 1 s e liga em 2,5 s', async (p) => {
  await abrirPulando(p);
  assert.equal(await estadoPC(p), 'ligado');
  await p.click('[data-item=energia]', { force: true });
  assert.equal(await estadoPC(p), 'desligando');
  await p.waitForTimeout(1100);
  assert.equal(await estadoPC(p), 'desligado');
  await p.click('[data-item=energia]', { force: true });
  assert.equal(await estadoPC(p), 'iniciando');
  await p.waitForTimeout(1000);
  await p.click('[data-item=energia]', { force: true }); // PC-04: ignorado
  assert.equal(await estadoPC(p), 'iniciando');
  await p.waitForTimeout(1600);
  assert.equal(await estadoPC(p), 'ligado');
});

await caso('RF-16/PC-07', 'janelas abrem uma vez, arrastam dentro dos limites e fecham ao desligar', async (p) => {
  await abrirPulando(p);
  await p.click('[data-item=monitor]', { force: true });
  await p.waitForTimeout(700);
  await p.click('.pc-icone-app[data-app=leiame]');
  await p.evaluate(() => document.querySelector('.pc-icone-app[data-app=leiame]').click());
  assert.equal(await p.locator('.pc-janela').count(), 1);
  const titulo = p.locator('.pc-janela-titulo').first();
  const caixa = await titulo.boundingBox();
  await p.mouse.move(caixa.x + 40, caixa.y + caixa.height / 2);
  await p.mouse.down();
  await p.mouse.move(-2000, -2000, { steps: 5 });
  await p.mouse.up();
  const pos = await p.evaluate(() => { const j = document.querySelector('.pc-janela'); return { x: parseFloat(j.style.left), y: parseFloat(j.style.top), w: parseFloat(j.style.width) }; });
  assert.ok(pos.x + pos.w >= 48 && pos.y >= 0, JSON.stringify(pos));
  await p.evaluate(() => document.querySelector('.pc-btn-desligar').click());
  await p.waitForTimeout(1100);
  assert.equal(await estadoPC(p), 'desligado');
  assert.equal(await p.locator('.pc-janela').count(), 0);
});

await caso('RF-18/RF-20', 'GitHub abre e nunca fica vazio (API ou reserva)', async (p) => {
  await abrirPulando(p);
  await p.click('[data-item=monitor]', { force: true });
  await p.waitForTimeout(700);
  await p.click('.pc-icone-app[data-app=github]');
  await p.waitForSelector('.gh-status, .gh-vazio', { timeout: 20000 });
  assert.ok(await p.locator('.gh-repo').count() > 0);
  await p.click('.gh-acoes .pc-botao-principal');
  const abertos = await p.evaluate(() => window.__abertos);
  assert.deepEqual(abertos, [['https://github.com/LucasFroisVasconcellos', '_blank', 'noopener,noreferrer']]);
});

await caso('GH-07 (navegador)', 'texto malicioso vindo da API aparece como texto', async (p) => {
  await p.route('https://api.github.com/**', (rota) => {
    const url = rota.request().url();
    const corpo = url.includes('/repos?') ? [{ name: 'x', fork: false, description: '<img src=x onerror="window.__xss=1">', language: 'JS', stargazers_count: 0, pushed_at: '2026-10-10T10:00:00Z', html_url: 'https://evil.com/x' }]
      : url.includes('/commits') ? [] : { login: 'LucasFroisVasconcellos', name: '<b>oi</b>', public_repos: 1, followers: 0 };
    rota.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(corpo) });
  });
  await abrirPulando(p);
  await p.click('[data-item=monitor]', { force: true });
  await p.waitForTimeout(700);
  await p.click('.pc-icone-app[data-app=github]');
  await p.waitForSelector('.gh-repo');
  assert.equal(await p.locator('.gh img[src=x]').count(), 0);
  assert.equal(await p.textContent('.gh-desc'), '<img src=x onerror="window.__xss=1">');
  assert.equal(await p.locator('.gh-repo a').count(), 0); // GH-08
  assert.equal(await p.evaluate(() => window.__xss), undefined);
});

await caso('WA-01/07/08', 'WhatsApp: confirmação, cancelar mantém o texto, link exato e nada guardado', async (p) => {
  await abrirPulando(p);
  await p.click('[data-item=notebook]', { force: true });
  await p.waitForTimeout(700);
  await p.click('.nb-app[data-app=whatsapp]');
  assert.equal(await p.isDisabled('.wa-enviar'), true);
  await p.fill('.wa-campo', 'Olá, tudo bem?');
  await p.click('.wa-enviar');
  await p.click('.wa-confirmar-botoes .wa-btn:not(.wa-btn-principal)');
  assert.equal(await p.inputValue('.wa-campo'), 'Olá, tudo bem?');
  assert.deepEqual(await p.evaluate(() => window.__abertos), []);
  await p.click('.wa-enviar');
  await p.click('.wa-btn-principal');
  assert.deepEqual(await p.evaluate(() => window.__abertos), [['https://wa.me/5511958153322?text=Ol%C3%A1%2C%20tudo%20bem%3F', '_blank', 'noopener,noreferrer']]);
  const guardado = await p.evaluate(() => JSON.stringify(Object.entries(localStorage)));
  assert.ok(!guardado.includes('tudo bem'));
  await p.fill('.wa-campo', 'x'.repeat(600));
  assert.equal((await p.inputValue('.wa-campo')).length, 500); // WA-06
});

await caso('SG-02/SG-07', 'links externos com noopener e telas emuladas com “Simulação”', async (p) => {
  await abrirPulando(p);
  await p.click('[data-item=notebook]', { force: true });
  await p.waitForTimeout(700);
  for (const app of ['whatsapp', 'instagram', 'linkedin']) {
    if (await p.isVisible('.nb-inicio')) await p.click('.nb-inicio');
    await p.click(`.nb-app[data-app=${app}]`);
    assert.ok(await p.locator('.nb-selo').first().isVisible(), app);
  }
  const links = await p.evaluate(() => [...document.querySelectorAll('a[href^="http"]')].map((a) => ({ rel: a.rel, target: a.target, href: a.href })));
  for (const l of links) assert.ok(l.rel.includes('noopener') && l.rel.includes('noreferrer') && l.target === '_blank', l.href);
});

await caso('RF-32', 'idioma troca sem recarregar e sem fechar janelas; escolha lembrada', async (p) => {
  await abrirPulando(p);
  await p.click('[data-item=monitor]', { force: true });
  await p.waitForTimeout(700);
  await p.click('.pc-icone-app[data-app=leiame]');
  await p.click('[data-idioma=en]');
  assert.equal(await p.textContent('#btn-voltar span[data-i18n]'), 'Back');
  assert.equal(await p.locator('.pc-janela').count(), 1);
  assert.equal(await p.textContent('.pc-janela-titulo-texto'), 'Read me');
  await p.reload();
  await p.waitForFunction(() => document.body.classList.contains('modo-quarto'));
  assert.equal(await paredeAtual(p), 'PC wall');
});

await caso('RNF-17', 'com o armazenamento bloqueado o site funciona', async (p) => {
  await abrirPulando(p);
  await p.click('#seta-dir');
  await p.waitForTimeout(500);
  assert.equal(await paredeAtual(p), 'Parede do guarda-roupa');
}, {
  antes: (p) => p.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('bloqueado', 'SecurityError'); } });
  }),
});

await caso('SG-05', 'parâmetros e # na URL não mudam nada', async (p) => {
  await p.goto(`${BASE}?passeio=0&idioma=en&debug=1#monitor`);
  await p.waitForSelector('#btn-pular:not([hidden])');
  assert.equal(await p.textContent('#texto-passeio'), 'Quarto interativo');
});

await caso('BL-01/RF-12/RF-13', 'blecaute aos 10 s sem entrada, uma vez só, e aviso “Ligue o PC”', async (p) => {
  await p.clock.install();
  await abrirPulando(p);
  await p.clock.runFor(9500);
  assert.equal(await estadoPC(p), 'ligado');
  await p.clock.runFor(800);
  assert.equal(await estadoPC(p), 'desligado');
  await p.clock.runFor(1000);
  await p.click('[data-item=energia]', { force: true }); // BL-12: ignorado durante os 3 s
  assert.equal(await estadoPC(p), 'desligado');
  await p.clock.runFor(2200);
  assert.equal(await p.isVisible('#aviso-ligue'), true);
  assert.equal(await p.isVisible('#seta-ligue'), true);
  await p.click('[data-item=energia]', { force: true });
  assert.equal(await estadoPC(p), 'iniciando');
  assert.equal(await p.isHidden('#aviso-ligue'), true);
  await p.clock.runFor(3000);
  assert.equal(await estadoPC(p), 'ligado');
  await p.clock.runFor(200000); // BL-09
  assert.equal(await estadoPC(p), 'ligado');
});

await caso('BL-08', 'na parede de trás não há blecaute', async (p) => {
  await p.clock.install();
  await abrirPulando(p);
  await p.click('#seta-dir');
  await p.clock.runFor(500);
  await p.click('#seta-dir');
  await p.clock.runFor(60000);
  assert.equal(await estadoPC(p), 'ligado');
});

await caso('BL-02', 'só movendo o mouse: blecaute aos 20 s', async (p) => {
  await p.clock.install();
  await abrirPulando(p);
  for (let t = 0; t < 19; t++) { await p.mouse.move(300 + (t % 2) * 50, 300); await p.clock.runFor(1000); }
  assert.equal(await estadoPC(p), 'ligado');
  await p.clock.runFor(1500);
  assert.equal(await estadoPC(p), 'desligado');
});

await caso('RF-23', 'celular em pé: aviso “Gire o celular” e “Continuar em pé”', async (p) => {
  await abrirPulando(p);
  await p.tap('[data-item=monitor]', { force: true });
  await p.waitForSelector('#aviso-gire:not([hidden])');
  await p.tap('#btn-continuar-pe');
  assert.equal(await p.isHidden('#aviso-gire'), true);
}, { contexto: { viewport: { width: 412, height: 869 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2.625 } });

await caso('RF-01', 'no Note 10 deitado, todo item clicável cabe na tela', async (p) => {
  await abrirPulando(p);
  const fora = await p.evaluate(() => [...document.querySelectorAll('.giro:not([data-oculta]) .item')].filter((b) => {
    const r = b.getBoundingClientRect();
    return r.left < 0 || r.top < 0 || r.right > innerWidth || r.bottom > innerHeight;
  }).map((b) => b.dataset.item));
  assert.deepEqual(fora, []);
}, { contexto: { viewport: { width: 869, height: 412 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2.625 } });

await caso('RNF-12', 'área de toque de 44 px em todos os itens (Note 10 em pé)', async (p) => {
  await abrirPulando(p);
  const pequenos = await p.evaluate(() => [...document.querySelectorAll('.giro:not([data-oculta]) .item .alvo')].map((a) => a.getBoundingClientRect()).filter((r) => r.width < 43.5 || r.height < 43.5).length);
  assert.equal(pequenos, 0);
}, { contexto: { viewport: { width: 412, height: 869 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2.625 } });

await caso('RF-31', 'medalhas abrem em 3D (ou 2D sem WebGL) e mostram os dados', async (p) => {
  await abrirPulando(p);
  await p.click('#seta-dir'); await p.waitForTimeout(450);
  await p.click('#seta-dir'); await p.waitForTimeout(450);
  await p.click('[data-item=medalhas]', { force: true });
  await p.waitForSelector('.medalha-canvas, .medalha-2d', { timeout: 15000 });
  assert.ok((await p.textContent('.medalha-info')).includes('MVP'));
});

await navegador.close();
servidor.kill();

const largura = Math.max(...resultados.map((r) => r.id.length));
for (const r of resultados) console.log(`${r.resultado.padEnd(5)} ${r.id.padEnd(largura)}  ${r.nome}${r.detalhe ? `\n      → ${r.detalhe}` : ''}`);
const falhas = resultados.filter((r) => r.resultado !== 'PASS').length;
console.log(`\n${resultados.length - falhas}/${resultados.length} PASS`);
process.exit(falhas ? 1 : 0);
