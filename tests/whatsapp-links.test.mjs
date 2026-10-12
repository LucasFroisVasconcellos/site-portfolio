// Casos WA (seção 10.5), links da seção 7.8 e auditoria por valores aleatórios.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { linkWhatsApp, limparMensagem, podeEnviar, LIMITE_MENSAGEM } from '../site/js/whatsapp.js';
import { destinoPermitido, linkPermitido, abrirExterno, criarLink } from '../site/js/links.js';
import { CONFIG } from '../site/js/config.js';

const N = '5511999999999';
const base = `https://wa.me/${N}?text=`;

test('WA-01', () => assert.equal(linkWhatsApp(N, 'Olá, tudo bem?'), `${base}Ol%C3%A1%2C%20tudo%20bem%3F`));
test('WA-02', () => assert.equal(linkWhatsApp(N, 'Preço & prazo #1'), `${base}Pre%C3%A7o%20%26%20prazo%20%231`));
test('WA-03', () => assert.equal(linkWhatsApp(N, 'Oi 👋'), `${base}Oi%20%F0%9F%91%8B`));
test('WA-04', () => assert.equal(linkWhatsApp(N, 'a=b?c'), `${base}a%3Db%3Fc`));
test('WA-05: vazia ou só espaços → nenhum link e Enviar desligado', () => {
  for (const t of ['', '   ', '\n\t ', '\u0000']) {
    assert.equal(linkWhatsApp(N, t), null);
    assert.equal(podeEnviar(t), false);
  }
});
test('WA-06: 501 caracteres → só 500', () => {
  assert.equal(limparMensagem('a'.repeat(501)).length, LIMITE_MENSAGEM);
  // Corte no meio de um emoji não deixa metade sobrando.
  const s = limparMensagem('a'.repeat(499) + '😀');
  assert.equal(s, 'a'.repeat(499));
});
test('WA-09: metade de um emoji é removida sem erro', () => {
  assert.equal(linkWhatsApp(N, 'oi \uD83D fim'), `${base}oi%20%20fim`);
  assert.equal(linkWhatsApp(N, 'oi \uDE00 fim'), `${base}oi%20%20fim`);
});
test('Número inválido em config nunca gera link', () => {
  for (const n of ['', '55 11 9', '+5511999999999', '5511999999999?x=1', '0123456789', 123]) {
    assert.throws(() => linkWhatsApp(n, 'oi'));
  }
});
test('O número da configuração é válido e gera link permitido', () => {
  const l = linkWhatsApp(CONFIG.whatsapp, 'teste');
  assert.equal(destinoPermitido(l), 'whatsapp');
});

test('Auditoria: 100.000 textos aleatórios', () => {
  let semente = 99;
  const rnd = () => { semente = (semente * 1103515245 + 12345) % 2147483648; return semente / 2147483648; };
  const pedacos = ['&', '?', '#', '=', '%', '+', ' ', '/', '\n', '😀', '\uD83D', '\uDE00', 'á', 'ç', 'a', 'Z', '0', '"', '<', '>', '\u0000', '‮', 'text=', '&text=x'];
  for (let i = 0; i < 100000; i++) {
    let t = '';
    const n = Math.floor(rnd() * 40);
    for (let j = 0; j < n; j++) t += pedacos[Math.floor(rnd() * pedacos.length)];
    if (rnd() < 0.01) t = t.repeat(30);
    const l = linkWhatsApp(N, t);
    if (l === null) { assert.equal(podeEnviar(t), false); continue; }
    assert.ok(l.startsWith(base));
    const u = new URL(l);
    assert.equal(u.hostname, 'wa.me');
    assert.equal(u.pathname, `/${N}`);
    assert.deepEqual([...u.searchParams.keys()], ['text']);
    assert.equal(decodeURIComponent(l.slice(base.length)), limparMensagem(t));
    assert.ok(limparMensagem(t).length <= LIMITE_MENSAGEM);
  }
});

test('SG-02/links: só os endereços da lista da seção 7.8', () => {
  const ok = [
    'https://github.com/LucasFroisVasconcellos',
    'https://github.com/LucasFroisVasconcellos/site-portfolio',
    'https://github.com/lucasfroisvasconcellos/Planner-Tw/commit/abc',
    CONFIG.instagram, CONFIG.linkedin,
    `https://wa.me/${CONFIG.whatsapp}`, `https://wa.me/${CONFIG.whatsapp}?text=oi`,
  ];
  const ruins = [
    'http://github.com/LucasFroisVasconcellos',
    'https://github.com/LucasFroisVasconcellosEvil',
    'https://github.com/outro/LucasFroisVasconcellos',
    'https://github.com.evil.com/LucasFroisVasconcellos',
    'https://evil.com/https://github.com/LucasFroisVasconcellos',
    'https://user:pass@github.com/LucasFroisVasconcellos',
    'https://github.com:444/LucasFroisVasconcellos',
    'javascript:alert(1)', 'data:text/html,x', '//github.com/LucasFroisVasconcellos',
    'https://wa.me/5511000000000?text=oi', `https://wa.me/${CONFIG.whatsapp}?text=a&phone=1`,
    'https://www.instagram.com/outro/', 'https://www.linkedin.com/in/outro/',
    `https://www.instagram.com/lucas_frois1/?next=https://evil.com`,
    '', null, 42, 'https://' + 'a'.repeat(5000),
  ];
  for (const u of ok) assert.ok(linkPermitido(u), u);
  for (const u of ruins) assert.equal(linkPermitido(u), false, String(u));
});

test('SG-02: abrirExterno usa nova aba com noopener,noreferrer e recusa fora da lista', () => {
  const abertos = [];
  const janela = { open: (...a) => abertos.push(a) };
  assert.equal(abrirExterno('https://evil.com', janela), false);
  assert.equal(abrirExterno(CONFIG.linkedin, janela), true);
  assert.deepEqual(abertos, [[CONFIG.linkedin, '_blank', 'noopener,noreferrer']]);
});

test('criarLink: rel e target corretos; endereço proibido vira texto', () => {
  const criados = [];
  const doc = { createElement: (tag) => { const el = { tag }; criados.push(el); return el; } };
  const a = criarLink(doc, CONFIG.instagram, 'Insta');
  assert.equal(a.tag, 'a'); assert.equal(a.rel, 'noopener noreferrer'); assert.equal(a.target, '_blank');
  const s = criarLink(doc, 'https://evil.com', '<b>x</b>');
  assert.equal(s.tag, 'span'); assert.equal(s.textContent, '<b>x</b>');
});
