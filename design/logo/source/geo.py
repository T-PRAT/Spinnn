"""Geometry helpers for Spinnn logo exploration. All shapes are filled outlines (no strokes),
wound clockwise on screen so overlapping sub-paths union under the default nonzero rule."""
import math

from s_stroke import s_stroke, s_stroke3


def f(v):
    s = f"{v:.2f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


def pt(p):
    return f"{f(p[0])} {f(p[1])}"


def rect(x, y, w, h):
    return f"M{pt((x, y))} H{f(x + w)} V{f(y + h)} H{f(x)} Z"


def circle(cx, cy, r, cw=True):
    sweep = 1 if cw else 0
    return (f"M{pt((cx - r, cy))} A{f(r)} {f(r)} 0 1 {sweep} {pt((cx + r, cy))} "
            f"A{f(r)} {f(r)} 0 1 {sweep} {pt((cx - r, cy))} Z")


def ring(cx, cy, ro, ri):
    return circle(cx, cy, ro, True) + " " + circle(cx, cy, ri, False)


def epoint(cx, cy, rx, ry, deg):
    a = math.radians(deg)
    return (cx + rx * math.cos(a), cy + ry * math.sin(a))


def s_letter(x, base, xh, t, rmx, overshoot=2):
    """Monoline geometric 's' from two stacked elliptical bowls sharing a tangent spine.
    x = left edge, base = baseline y, xh = x-height."""
    top = base - xh - overshoot
    bot = base + overshoot
    h = bot - top
    rmy = (h - t) / 4
    cx = x + rmx + t / 2
    cy1 = top + t / 2 + rmy
    cy2 = cy1 + 2 * rmy
    uo, ui = (rmx + t / 2, rmy + t / 2), (rmx - t / 2, rmy - t / 2)
    lo, li = uo, ui
    a0, a1 = -38, 142  # terminals
    P = lambda c, r, d: epoint(cx, c, r[0], r[1], d)
    d = (f"M{pt(P(cy1, uo, a0))} A{f(uo[0])} {f(uo[1])} 0 1 0 {pt(P(cy1, uo, 90))} "
         f"A{f(li[0])} {f(li[1])} 0 1 1 {pt(P(cy2, li, a1))} "
         f"L{pt(P(cy2, lo, a1))} "
         f"A{f(lo[0])} {f(lo[1])} 0 1 0 {pt(P(cy2, lo, 270))} "
         f"A{f(ui[0])} {f(ui[1])} 0 1 1 {pt(P(cy1, ui, a0))} Z")
    return d, 2 * rmx + t


def n_letter(x, base, xh, t, w, overshoot=2, thin_top=0.0):
    """Lowercase n: two stems + semicircular arch. thin_top thins the arch apex (optical correction:
    the inner counter becomes a slightly taller half-ellipse, stems keep their full weight). Returns (path, width)."""
    ro = w / 2
    ri = ro - t
    cy = base - xh + ro - overshoot
    d = (f"M{pt((x, base))} V{f(cy)} A{f(ro)} {f(ro)} 0 0 1 {pt((x + w, cy))} V{f(base)} "
         f"H{f(x + w - t)} V{f(cy)} A{f(ri)} {f(ri + thin_top)} 0 0 0 {pt((x + t, cy))} V{f(base)} Z")
    return d, w


def i_letter(x, base, xh, t, dot_gap):
    r = t * 0.62
    cx = x + t / 2
    d = rect(x, base - xh, t, xh) + " " + circle(cx, base - xh - dot_gap - r, r)
    return d, t


def p_letter(x, base, xh, t, desc, overshoot=2):
    ro = xh / 2 + overshoot
    ri = ro - t
    cy = base - xh / 2
    cx = x + ro
    d = rect(x, base - xh, t, xh + desc) + " " + ring(cx, cy, ro, ri)
    return d, 2 * ro


def wordmark(x0=0, base=184, xh=112, t=26, gap=20, n_rise=(0, 0, 0), color="#111", thin_top=0.0,
             split=False, spacing=(0, 2, 4, 4), s_kw=None):
    """'spinnn' as outlined paths. n_rise lifts each n's x-height (ramp concept).
    spacing = extra space after s, p, i and between the n's. split=True returns ('spi' path, 'nnn' path)."""
    parts = []
    x = x0
    # squarish quarters fill the top-right / bottom-left corners so the s stands upright
    skw = dict(s_kw or dict(squarish=True, w=84, k=0.66, t_up=0.7, t_lo=0.72))
    draw = s_stroke3 if skw.pop("squarish", False) else s_stroke
    d, w, _ = draw(x=x, base=base, xh=xh, tv=t, th=t - 3, **skw)
    parts.append(d); x += w + gap + spacing[0]
    d, w = p_letter(x, base, xh, t, desc=50)
    parts.append(d); x += w + gap + spacing[1]
    d, w = i_letter(x, base, xh, t, dot_gap=14)
    parts.append(d); x += w + gap + spacing[2]
    ns = []
    for k in range(3):
        d, w = n_letter(x, base, xh + n_rise[k], t, w=98, thin_top=thin_top)
        ns.append(d); x += w + gap + spacing[3]
    width = x - gap - spacing[3]
    if split:
        return (" ".join(parts), " ".join(ns)), width
    return " ".join(parts + ns), width


def rot(p, deg, c=(128, 128)):
    a = math.radians(deg)
    x, y = p[0] - c[0], p[1] - c[1]
    return (c[0] + x * math.cos(a) - y * math.sin(a), c[1] + x * math.sin(a) + y * math.cos(a))


def svg(viewbox, body, title="Spinnn logo", w=None, h=None):
    vb = viewbox.split()
    w = w or vb[2]
    h = h or vb[3]
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{viewbox}" width="{w}" height="{h}" '
            f'role="img" aria-labelledby="title">\n  <title id="title">{title}</title>\n{body}\n</svg>\n')


# ---------- squarish (Oxanium-like) letters: rounded outer corners, sharp inner corners ----------
def arc_to(r, x, y, sweep=1):
    return f"A{f(r)} {f(r)} 0 0 {sweep} {pt((x, y))}"


def n_sq(x, base, xh, t, w, ro):
    top = base - xh
    d = (f"M{pt((x, base))} V{f(top + ro)} {arc_to(ro, x + ro, top)} H{f(x + w - ro)} {arc_to(ro, x + w, top + ro)} "
         f"V{f(base)} H{f(x + w - t)} V{f(top + t)} H{f(x + t)} V{f(base)} Z")
    return d, w


def p_sq(x, base, xh, t, w, ro, desc):
    top = base - xh
    outer = (f"M{pt((x, top))} H{f(x + w - ro)} {arc_to(ro, x + w, top + ro)} V{f(base - ro)} "
             f"{arc_to(ro, x + w - ro, base)} H{f(x + t)} V{f(base + desc)} H{f(x)} Z")
    hole = f"M{pt((x + t, base - t))} H{f(x + w - t)} V{f(top + t)} H{f(x + t)} Z"  # counter-clockwise
    return outer + " " + hole, w


def i_sq(x, base, xh, t, dot_gap):
    d = rect(x, base - xh, t, xh) + " " + rect(x, base - xh - dot_gap - t, t, t)
    return d, t


def s_sq(x, base, xh, t, w, ro):
    y0, y1 = base - xh, base
    ym0 = y0 + (xh - t) / 2
    ym1 = ym0 + t
    d = (f"M{pt((x + w, y0))} V{f(y0 + t)} H{f(x + t)} V{f(ym0)} H{f(x + w - ro)} {arc_to(ro, x + w, ym0 + ro)} "
         f"V{f(y1 - ro)} {arc_to(ro, x + w - ro, y1)} H{f(x)} V{f(y1 - t)} H{f(x + w - t)} V{f(ym1)} "
         f"H{f(x + ro)} {arc_to(ro, x, ym1 - ro)} V{f(y0 + ro)} {arc_to(ro, x + ro, y0)} Z")
    return d, w


def wordmark_sq(x0=0, base=184, xh=112, t=26, gap=20, ro=34):
    parts = []
    x = x0
    for kind in ("s", "p", "i", "n", "n", "n"):
        if kind == "s":
            d, w = s_sq(x, base, xh, t, 84, ro)
        elif kind == "p":
            d, w = p_sq(x, base, xh, t, 96, ro, 50)
        elif kind == "i":
            d, w = i_sq(x, base, xh, t, 14)
        else:
            d, w = n_sq(x, base, xh, t, 92, ro)
        parts.append(d)
        x += w + gap
    return " ".join(parts), x - gap
