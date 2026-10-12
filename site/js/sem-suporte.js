// RF-08: só roda em navegadores sem módulos JavaScript (atributo nomodule).
(function () {
  var aviso = document.getElementById('sem-suporte');
  var carregando = document.getElementById('carregamento');
  if (carregando) carregando.style.display = 'none';
  if (aviso) aviso.removeAttribute('hidden');
}());
