// Aviso do modo escuro forçado do Samsung Internet.
// O Samsung Internet escurece qualquer site quando o celular está no tema escuro e não deixa o
// site desligar isso (o color-scheme só vale com uma opção experimental ligada pelo usuário).
// Então, só nesse navegador e com o tema escuro, mostramos uma vez como ver as cores reais:
// abrir no Chrome com um toque, ou a opção do próprio Samsung Internet.

export function samsungComTemaEscuro(ua = navigator.userAgent, mm = globalThis.matchMedia) {
  return /SamsungBrowser\//.test(ua) && Boolean(mm?.('(prefers-color-scheme: dark)').matches);
}

// Endereço que o Android abre direto no Chrome (mesma página, mesmo idioma escolhido).
export function enderecoNoChrome(loc = location) {
  return `intent://${loc.host}${loc.pathname}#Intent;scheme=https;package=com.android.chrome;end`;
}

export function instalarAvisoEscuro(ctx) {
  const { $, armazenamento } = ctx;
  const aviso = $('aviso-escuro');
  const fechar = () => {
    aviso.hidden = true;
    armazenamento.gravar('aviso-escuro', true);
  };
  $('btn-abrir-chrome').addEventListener('click', () => { location.href = enderecoNoChrome(); });
  $('btn-fechar-escuro').addEventListener('click', fechar);

  ctx.mostrarAvisoEscuro = () => {
    if (!samsungComTemaEscuro()) return;
    if (armazenamento.ler('aviso-escuro', (d) => (d === true ? true : null))) return;
    aviso.hidden = false;
  };
}
