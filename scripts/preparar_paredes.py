"""Prepara as ilustrações das paredes para o site (ARQ-002, seção 6.3 e Fase 0).

Uso:  python scripts/preparar_paredes.py
Lê:   originais/<parede>.png|jpg|webp   (pasta fora do Git: fica só no seu PC)
Grava: site/img/paredes/<parede>-nitido.webp e <parede>-leve.webp

O script só recorta, redimensiona e converte. Não desenha nada.
- Nítido: até 2560 px de largura (nunca amplia a imagem).
- Leve: metade do nítido, até 1280 px. Carrega primeiro.
- Sai em WebP sem metadados (sem EXIF, GPS, data ou câmera: seção 9.3 e SG-06).
"""
from pathlib import Path
import json
import sys

from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
ORIGEM = RAIZ / "originais"
DESTINO = RAIZ / "site" / "img" / "paredes"
PAREDES = ["frente", "direita", "tras", "esquerda"]
EXTENSOES = [".png", ".jpg", ".jpeg", ".webp"]


def achar_original(nome):
    for ext in EXTENSOES:
        caminho = ORIGEM / f"{nome}{ext}"
        if caminho.exists():
            return caminho
    return None


def salvar_sem_metadados(img, caminho, qualidade):
    # Recria a imagem a partir dos pixels: nada do arquivo original é copiado.
    limpa = Image.frombytes("RGB", img.size, img.convert("RGB").tobytes())
    limpa.save(caminho, "WEBP", quality=qualidade, method=6)


def preparar(nome):
    original = achar_original(nome)
    if original is None:
        return None
    with Image.open(original) as img:
        img = img.convert("RGB")
        largura = min(2560, img.width)
        if largura != img.width:
            altura = round(img.height * largura / img.width)
            img = img.resize((largura, altura), Image.LANCZOS)
        nitido = DESTINO / f"{nome}-nitido.webp"
        salvar_sem_metadados(img, nitido, 90)
        leve_larg = min(1280, max(1, img.width // 2))
        leve_alt = round(img.height * leve_larg / img.width)
        leve = DESTINO / f"{nome}-leve.webp"
        salvar_sem_metadados(img.resize((leve_larg, leve_alt), Image.LANCZOS), leve, 72)
        return {"parede": nome, "largura": img.width, "altura": img.height,
                "nitido_kb": round(nitido.stat().st_size / 1024, 1),
                "leve_kb": round(leve.stat().st_size / 1024, 1)}


def main():
    DESTINO.mkdir(parents=True, exist_ok=True)
    relatorio = [r for r in (preparar(p) for p in PAREDES) if r]
    faltando = [p for p in PAREDES if not any(r["parede"] == p for r in relatorio)]
    print(json.dumps({"preparadas": relatorio, "faltando": faltando}, ensure_ascii=False, indent=2))
    if not relatorio:
        sys.exit("Nenhuma ilustração encontrada em originais/")


if __name__ == "__main__":
    main()
