"""Final artwork for Spinnn — direction B "Rampe". Writes master SVGs into <out>/svg."""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from geo import f, n_letter, svg, wordmark  # noqa: E402

OUT = sys.argv[1]
SVG = os.path.join(OUT, "svg")
os.makedirs(SVG, exist_ok=True)

ORANGE = "#EA580C"   # Spinnn Orange
NIGHT = "#1C1917"    # Nuit (ink)
CHALK = "#FDFBF7"    # Craie (paper)
BLACK, WHITE = "#000000", "#FFFFFF"

# ---- wordmark: 'spi' + rising 'nnn' (ramp 0 / +26 / +52 on a 112 x-height), arch apex thinned 3 units ----
RISE = (0, 26, 52)
(SPI, NNN), WM_W = wordmark(n_rise=RISE, thin_top=3, split=True)
# reversed (light on dark): 1 unit thinner to offset irradiation
(SPI_R, NNN_R), _ = wordmark(n_rise=RISE, thin_top=3, split=True, t=25, gap=20.2)
PAD = 8
S_INK_LEFT = 2   # the drawn s starts 2 units in from its box
WM_VB = f"{f(S_INK_LEFT - PAD)} 0 {f(WM_W - S_INK_LEFT + 2 * PAD)} 256"


# ---- symbol: the ramp alone, drawn on a 16-unit grid (unit = 16) so it stays crisp at 16 px ----
def symbol_path(t=16):
    x, parts = 0, []
    for h in (128, 176, 224):          # 8, 11, 14 px at 16 px
        d, _ = n_letter(x + (16 - t) / 2, 240, h - (16 - t) / 2, t, 64 - (16 - t), overshoot=0)
        parts.append(d)
        x += 64 + 32
    return " ".join(parts)


SYM = symbol_path(16)
SYM_R = symbol_path(15)


def write(name, body, vb, title="Spinnn"):
    with open(os.path.join(SVG, name), "w") as fh:
        fh.write(svg(vb, body, title))


def p(d, fill, gid=None):
    g = f' id="{gid}"' if gid else ""
    return f'  <path{g} fill="{fill}" d="{d}"/>'


# wordmark
write("spinnn-wordmark.svg", p(SPI, NIGHT, "spi") + "\n" + p(NNN, ORANGE, "nnn"), WM_VB)
write("spinnn-wordmark-dark.svg", p(SPI_R, CHALK, "spi") + "\n" + p(NNN_R, ORANGE, "nnn"), WM_VB)
write("spinnn-wordmark-black.svg", p(SPI + " " + NNN, BLACK, "wordmark"), WM_VB)
write("spinnn-wordmark-white.svg", p(SPI_R + " " + NNN_R, WHITE, "wordmark"), WM_VB)
write("spinnn-wordmark-orange.svg", p(SPI + " " + NNN, ORANGE, "wordmark"), WM_VB)

# symbol
write("spinnn-symbol.svg", p(SYM, ORANGE, "symbol"), "0 0 256 256")
write("spinnn-symbol-black.svg", p(SYM, BLACK, "symbol"), "0 0 256 256")
write("spinnn-symbol-white.svg", p(SYM_R, WHITE, "symbol"), "0 0 256 256")
write("spinnn-symbol-night.svg", p(SYM, NIGHT, "symbol"), "0 0 256 256")

print("wordmark width", WM_W, "viewBox", WM_VB)
