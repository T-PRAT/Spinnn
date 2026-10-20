"""Geometric 's' drawn as an expanded stroke: a smooth centre line, a width that follows the stroke direction
(th when horizontal, tv when vertical), and each side refitted as one cubic Bézier per segment."""
import math

K = 0.5523


def bez(c, t):
    p0, p1, p2, p3 = c
    u = 1 - t
    return (u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0],
            u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1])


def dbez(c, t):
    p0, p1, p2, p3 = c
    u = 1 - t
    return (3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]),
            3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]))


def unit(v):
    n = math.hypot(*v)
    return (v[0] / n, v[1] / n)


def ellipse_arc(cx, cy, rx, ry, a0, a1):
    """Cubic approximation of an elliptical arc from angle a0 to a1 (degrees, |a1-a0| <= 90)."""
    t0, t1 = math.radians(a0), math.radians(a1)
    k = 4 / 3 * math.tan((t1 - t0) / 4)
    p0 = (cx + rx * math.cos(t0), cy + ry * math.sin(t0))
    p3 = (cx + rx * math.cos(t1), cy + ry * math.sin(t1))
    p1 = (p0[0] - k * rx * math.sin(t0), p0[1] + k * ry * math.cos(t0))
    p2 = (p3[0] + k * rx * math.sin(t1), p3[1] - k * ry * math.cos(t1))
    return (p0, p1, p2, p3)


def fit(samples, t0dir, t3dir):
    """Least-squares cubic through samples with fixed ends and end tangent directions (Schneider)."""
    p0, p3 = samples[0], samples[-1]
    d = [0.0]
    for a, b in zip(samples, samples[1:]):
        d.append(d[-1] + math.dist(a, b))
    ts = [x / d[-1] for x in d]
    for _ in range(4):
        c11 = c12 = c22 = x1 = x2 = 0.0
        for s, t in zip(samples, ts):
            u = 1 - t
            b0, b1, b2, b3 = u**3, 3 * u * u * t, 3 * u * t * t, t**3
            a1 = (t0dir[0] * b1, t0dir[1] * b1)
            a2 = (-t3dir[0] * b2, -t3dir[1] * b2)
            tmp = (s[0] - (p0[0] * (b0 + b1) + p3[0] * (b2 + b3)), s[1] - (p0[1] * (b0 + b1) + p3[1] * (b2 + b3)))
            c11 += a1[0] * a1[0] + a1[1] * a1[1]
            c12 += a1[0] * a2[0] + a1[1] * a2[1]
            c22 += a2[0] * a2[0] + a2[1] * a2[1]
            x1 += a1[0] * tmp[0] + a1[1] * tmp[1]
            x2 += a2[0] * tmp[0] + a2[1] * tmp[1]
        det = c11 * c22 - c12 * c12
        al, be = (x1 * c22 - x2 * c12) / det, (c11 * x2 - c12 * x1) / det
        c = (p0, (p0[0] + t0dir[0] * al, p0[1] + t0dir[1] * al), (p3[0] - t3dir[0] * be, p3[1] - t3dir[1] * be), p3)
        # reparameterise: one Newton step per sample
        new = []
        for s, t in zip(samples, ts):
            q, dq = bez(c, t), dbez(c, t)
            num = (q[0] - s[0]) * dq[0] + (q[1] - s[1]) * dq[1]
            den = dq[0] ** 2 + dq[1] ** 2
            new.append(min(1.0, max(0.0, t - num / den)) if den else t)
        ts = new
    err = max(math.dist(bez(c, t), s) for s, t in zip(samples, ts))
    return c, err


def s_stroke(x=0, base=184, xh=112, tv=26, th=23, w=84, over=2, upper_inset=3, cross=0.47,
             term_up=-38, term_lo=142, spine_a=0.6, ry_up=None, ry_lo=None):
    top, bot = base - xh - over, base + over
    top_c, bot_c = top + th / 2, bot - th / 2
    lu = x + upper_inset + tv / 2            # upper bowl, left side of the centre line
    ru = x + w - upper_inset - tv / 2        # upper bowl, right (terminal side)
    ll, rl = x + tv / 2, x + w - tv / 2      # lower bowl
    ym = top + (bot - top) * cross           # where the spine crosses
    ry_u = ry_up or (ym - top_c) * 0.62
    ry_l = ry_lo or (bot_c - ym) * 0.62
    cxu, cyu, rxu = (lu + ru) / 2, top_c + ry_u, (ru - lu) / 2
    cxl, cyl, rxl = (ll + rl) / 2, bot_c - ry_l, (rl - ll) / 2
    # centre line, as cubic segments (angles in SVG degrees: 0 = right, 90 = down)
    segs = []
    segs.append(ellipse_arc(cxu, cyu, rxu, ry_u, term_up, -90))            # terminal -> top
    segs.append(ellipse_arc(cxu, cyu, rxu, ry_u, -90, -180))               # top -> left side
    p0, p3 = (lu, cyu), (rl, cyl)
    span = cyl - cyu
    segs.append((p0, (p0[0], p0[1] + spine_a * span), (p3[0], p3[1] - spine_a * span), p3))  # spine
    segs.append(ellipse_arc(cxl, cyl, rxl, ry_l, 0, 90))                    # right side -> bottom
    segs.append(ellipse_arc(cxl, cyl, rxl, ry_l, 90, term_lo))             # bottom -> terminal

    def width(tan):
        return th + (tv - th) * abs(tan[1])

    sides = {+1: [], -1: []}
    max_err = 0.0
    for c in segs:
        for sgn in (+1, -1):
            pts = []
            for i in range(41):
                t = i / 40
                p = bez(c, t)
                tg = unit(dbez(c, t))
                n = (-tg[1], tg[0])
                hw = width(tg) / 2 * sgn
                pts.append((p[0] + n[0] * hw, p[1] + n[1] * hw))
            seg, err = fit(pts, unit(dbez(c, 0)), unit(dbez(c, 1)))
            sides[sgn].append(seg)
            max_err = max(max_err, err)

    def f(v):
        s = f"{v:.2f}".rstrip("0").rstrip(".")
        return "0" if s in ("-0", "") else s

    def P(p):
        return f"{f(p[0])} {f(p[1])}"

    a = sides[+1]
    b = [tuple(reversed(c)) for c in reversed(sides[-1])]
    d = f"M{P(a[0][0])} " + " ".join(f"C{P(c[1])} {P(c[2])} {P(c[3])}" for c in a)
    d += f" L{P(b[0][0])} " + " ".join(f"C{P(c[1])} {P(c[2])} {P(c[3])}" for c in b) + " Z"
    return d, w, max_err


def _split(c, t):
    p0, p1, p2, p3 = c
    lerp = lambda a, b: (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)
    a, b, cc = lerp(p0, p1), lerp(p1, p2), lerp(p2, p3)
    d, e = lerp(a, b), lerp(b, cc)
    m = lerp(d, e)
    return (p0, a, d, m), (m, e, cc, p3)


def _cross_t(c, p, u):
    """Parameter where cubic c crosses the line through p with direction u (bisection on the signed distance)."""
    g = lambda t: u[0] * (bez(c, t)[1] - p[1]) - u[1] * (bez(c, t)[0] - p[0])
    lo, hi = 0.0, 1.0
    glo = g(lo)
    if (glo > 0) == (g(hi) > 0):
        raise ValueError("cut line does not cross this side; extend the segment")
    for _ in range(60):
        mid = (lo + hi) / 2
        gm = g(mid)
        if (gm > 0) == (glo > 0):
            lo, glo = mid, gm
        else:
            hi = mid
    return (lo + hi) / 2


def s_stroke2(x=0, base=184, xh=112, tv=26, th=23, w=84, over=2, upper_inset=2, cross=0.47,
              term_up=-18, term_lo=162, cut=55, spine_a=0.55, ry_up=21, ry_lo=23, ext=60):
    """Like s_stroke, but the terminals reach further round and are cut by parallel slanted lines
    (angle `cut` from horizontal, '/' orientation) so the letter fills its box and stands upright."""
    top, bot = base - xh - over, base + over
    top_c, bot_c = top + th / 2, bot - th / 2
    lu, ru = x + upper_inset + tv / 2, x + w - upper_inset - tv / 2
    ll, rl = x + tv / 2, x + w - tv / 2
    cxu, cyu, rxu = (lu + ru) / 2, top_c + ry_up, (ru - lu) / 2
    cxl, cyl, rxl = (ll + rl) / 2, bot_c - ry_lo, (rl - ll) / 2
    segs = [ellipse_arc(cxu, cyu, rxu, ry_up, term_up + ext, term_up),
            ellipse_arc(cxu, cyu, rxu, ry_up, term_up, -90),
            ellipse_arc(cxu, cyu, rxu, ry_up, -90, -180)]
    p0, p3 = (lu, cyu), (rl, cyl)
    span = cyl - cyu
    segs.append((p0, (p0[0], p0[1] + spine_a * span), (p3[0], p3[1] - spine_a * span), p3))
    segs += [ellipse_arc(cxl, cyl, rxl, ry_lo, 0, 90), ellipse_arc(cxl, cyl, rxl, ry_lo, 90, term_lo),
             ellipse_arc(cxl, cyl, rxl, ry_lo, term_lo, term_lo + ext)]

    def width(tan):
        return th + (tv - th) * abs(tan[1])

    sides = {+1: [], -1: []}
    max_err = 0.0
    for c in segs:
        for sgn in (+1, -1):
            pts = []
            for i in range(41):
                t = i / 40
                p, tg = bez(c, t), unit(dbez(c, t))
                n = (-tg[1], tg[0])
                hw = width(tg) / 2 * sgn
                pts.append((p[0] + n[0] * hw, p[1] + n[1] * hw))
            seg, err = fit(pts, unit(dbez(c, 0)), unit(dbez(c, 1)))
            sides[sgn].append(seg)
            max_err = max(max_err, err)
    # clip the terminal segments with the slanted cut lines
    u = (math.cos(math.radians(cut)), -math.sin(math.radians(cut)))
    a_t = math.radians(term_up)
    pu = (cxu + rxu * math.cos(a_t), cyu + ry_up * math.sin(a_t))
    b_t = math.radians(term_lo)
    pl = (cxl + rxl * math.cos(b_t), cyl + ry_lo * math.sin(b_t))
    for sgn in (+1, -1):
        segs_s = sides[sgn]
        for k in (0, 1):                      # upper terminal: cut crosses one of the first two segments
            try:
                t = _cross_t(segs_s[k], pu, u)
            except ValueError:
                continue
            segs_s = [_split(segs_s[k], t)[1]] + segs_s[k + 1:]
            break
        else:
            raise ValueError("upper cut misses both terminal segments")
        n = len(segs_s)
        for k in (n - 1, n - 2):              # lower terminal
            try:
                t = _cross_t(segs_s[k], pl, u)
            except ValueError:
                continue
            segs_s = segs_s[:k] + [_split(segs_s[k], t)[0]]
            break
        else:
            raise ValueError("lower cut misses both terminal segments")
        sides[sgn] = segs_s

    def f(v):
        s = f"{v:.2f}".rstrip("0").rstrip(".")
        return "0" if s in ("-0", "") else s

    def P(p):
        return f"{f(p[0])} {f(p[1])}"

    a = sides[+1]
    b = [tuple(reversed(c)) for c in reversed(sides[-1])]
    d = f"M{P(a[0][0])} " + " ".join(f"C{P(c[1])} {P(c[2])} {P(c[3])}" for c in a)
    d += f" L{P(b[0][0])} " + " ".join(f"C{P(c[1])} {P(c[2])} {P(c[3])}" for c in b) + " Z"
    return d, w, max_err


def _quarter(p_from, p_to, k, start_horizontal=True):
    """Quarter curve between two extremes; k = handle factor (0.5523 = ellipse, higher = squarer)."""
    if start_horizontal:
        return (p_from, (p_from[0] + k * (p_to[0] - p_from[0]), p_from[1]),
                (p_to[0], p_to[1] + k * (p_from[1] - p_to[1])), p_to)
    return (p_from, (p_from[0], p_from[1] + k * (p_to[1] - p_from[1])),
            (p_to[0] + k * (p_from[0] - p_to[0]), p_to[1]), p_to)


def _rev(c):
    return (c[3], c[2], c[1], c[0])


def s_stroke3(x=0, base=184, xh=112, tv=26, th=23, w=84, over=2, upper_inset=2, k=0.62,
              t_up=0.62, t_lo=0.64, spine_a=0.55, ry_up=21, ry_lo=23):
    """s drawn as an expanded stroke on a centre line made of squarish quarters (handle factor k).
    t_up / t_lo: how far the terminals run along the top-right / bottom-left quarter (0 = top/bottom, 1 = side)."""
    top, bot = base - xh - over, base + over
    top_c, bot_c = top + th / 2, bot - th / 2
    lu, ru = x + upper_inset + tv / 2, x + w - upper_inset - tv / 2
    ll, rl = x + tv / 2, x + w - tv / 2
    cxu, cyu = (lu + ru) / 2, top_c + ry_up
    cxl, cyl = (ll + rl) / 2, bot_c - ry_lo
    q_tr = _quarter((cxu, top_c), (ru, cyu), k)
    q_tl = _quarter((cxu, top_c), (lu, cyu), k)
    q_br = _quarter((cxl, bot_c), (rl, cyl), k)
    q_bl = _quarter((cxl, bot_c), (ll, cyl), k)
    p0, p3 = (lu, cyu), (rl, cyl)
    span = cyl - cyu
    spine = (p0, (p0[0], p0[1] + spine_a * span), (p3[0], p3[1] - spine_a * span), p3)
    segs = [_rev(_split(q_tr, t_up)[0]), q_tl, spine, _rev(q_br), _split(q_bl, t_lo)[0]]

    def width(tan):
        return th + (tv - th) * abs(tan[1])

    sides = {+1: [], -1: []}
    max_err = 0.0
    for c in segs:
        for sgn in (+1, -1):
            pts = []
            for i in range(41):
                t = i / 40
                p, tg = bez(c, t), unit(dbez(c, t))
                n = (-tg[1], tg[0])
                hw = width(tg) / 2 * sgn
                pts.append((p[0] + n[0] * hw, p[1] + n[1] * hw))
            seg, err = fit(pts, unit(dbez(c, 0)), unit(dbez(c, 1)))
            sides[sgn].append(seg)
            max_err = max(max_err, err)

    def f(v):
        s = f"{v:.2f}".rstrip("0").rstrip(".")
        return "0" if s in ("-0", "") else s

    def P(p):
        return f"{f(p[0])} {f(p[1])}"

    a = sides[+1]
    b = [tuple(reversed(c)) for c in reversed(sides[-1])]
    d = f"M{P(a[0][0])} " + " ".join(f"C{P(c[1])} {P(c[2])} {P(c[3])}" for c in a)
    d += f" L{P(b[0][0])} " + " ".join(f"C{P(c[1])} {P(c[2])} {P(c[3])}" for c in b) + " Z"
    return d, w, max_err
