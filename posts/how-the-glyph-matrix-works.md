---
title: "How the Glyph Matrix on this site works"
date: 2026-09-23
summary: "A 25×25 grid of LEDs, five tiny simulations, and about 300 lines of TypeScript."
tags: ["meta", "physics", "code"]
draft: false
---

The round LED panel on the home page is a nod to the Glyph Matrix on the back of the Nothing Phone (3). It's a 25×25 grid, masked to a circle, so only the LEDs within a radius of ~12.6 cells exist.

## One buffer, many toys

Every toy writes brightness values between 0 and 1 into a single `Float32Array` of 625 cells, and a canvas draws each lit cell as a dot. Trails come for free: fade the buffer a little every frame instead of clearing it.

```ts
for (let i = 0; i < trail.length; i++) trail[i] *= 0.965
plot(trail, x2, y2, 1)
```

## The toys

| # | Toy | What's actually running |
|---|-----|-------------------------|
| 01 | Double pendulum | RK4 on the Euler–Lagrange equations |
| 02 | Orbit | Kepler plus a small 1/r⁴ term, so the ellipse precesses |
| 03 | U(1) lattice | Live Metropolis updates on compact U(1) gauge links |
| 04 | Clock | Oxford time in a 3×5 pixel font |
| 05 | Snake | You know this one |

## The physics in toy 03

Each link of the lattice carries a phase $U_\mu(x) = e^{i\theta_\mu(x)}$. The smallest closed loop, the plaquette, multiplies four of them:

$$
U_P(x) = U_\mu(x)\,U_\nu(x+\hat\mu)\,U_\mu^\dagger(x+\hat\nu)\,U_\nu^\dagger(x) = e^{i\theta_P(x)}
$$

and the Wilson action sums over all of them:

$$
S[U] = \beta \sum_P \bigl(1 - \cos\theta_P\bigr)
$$

Metropolis proposes a random kick to one link and accepts it with probability $\min\bigl(1, e^{-\Delta S}\bigr)$.

> The toy shades each plaquette by $\tfrac{1}{2}(1 - \cos\theta_P)$. At $\beta = 1.6$ you can watch the disorder flicker in real time.

---

Press ◀ ▶ under the matrix to cycle through them. On Snake, use the arrow keys or swipe.
