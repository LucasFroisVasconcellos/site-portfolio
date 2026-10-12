"""Gera as imagens de MARCAÇÃO (provisórias) usadas até a Fase 7.

Uso: python scripts/gerar_marcacao.py
Cada imagem traz escrito "marcação" para nunca ser confundida com conteúdo real.
Quando as fotos reais chegarem, basta trocar o arquivo e o JSON em site/conteudo/.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

RAIZ = Path(__file__).resolve().parent.parent
DEST = RAIZ / "site" / "img" / "marcacao"
FONTES = ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
          "C:/Windows/Fonts/arialbd.ttf"]


def fonte(tamanho):
    for f in FONTES:
        if Path(f).exists():
            return ImageFont.truetype(f, tamanho)
    return ImageFont.load_default()


def cartao(nome, tam, fundo, linhas, cor_texto="#1F2933"):
    img = Image.new("RGB", tam, fundo)
    d = ImageDraw.Draw(img)
    w, h = tam
    d.rectangle([6, 6, w - 7, h - 7], outline="#1F2933", width=4)
    total = len(linhas)
    for i, (texto, t) in enumerate(linhas):
        f = fonte(t)
        caixa = d.textbbox((0, 0), texto, font=f)
        tw, th = caixa[2] - caixa[0], caixa[3] - caixa[1]
        y = h / 2 + (i - (total - 1) / 2) * t * 1.5 - th / 2
        d.text(((w - tw) / 2, y), texto, font=f, fill=cor_texto)
    img.save(DEST / nome, "WEBP", quality=70, method=6)


def main():
    DEST.mkdir(parents=True, exist_ok=True)
    for ano, cor in [(2023, "#C9D6DF"), (2024, "#D8CFC4"), (2025, "#CFE0C3")]:
        cartao(f"foto-{ano}.webp", (1200, 800), cor,
               [("Foto de handebol", 64), (str(ano), 96), ("marcação", 40)])
    cores = ["#F4D35E", "#EE964B", "#F95738", "#0D3B66", "#83C5BE", "#E29578",
             "#B5838D", "#6D6875", "#FFB4A2"]
    for i, cor in enumerate(cores, 1):
        texto = "#FAF7F0" if cor in ("#0D3B66", "#6D6875", "#F95738") else "#1F2933"
        cartao(f"insta-{i}.webp", (600, 600), cor, [(f"Post {i}", 64), ("marcação", 32)], texto)
    for nome, cor in [("projeto-planner", "#E7D7C1"), ("projeto-calculadora", "#D5E3D0"),
                      ("projeto-mercado", "#D6DCE8"), ("projeto-portfolio", "#F1E3B8")]:
        cartao(f"{nome}.webp", (960, 540), cor, [("Imagem do projeto", 52), ("marcação", 32)])
    cartao("avatar.webp", (320, 320), "#FACC15", [("LF", 120)])


if __name__ == "__main__":
    main()
