import PptxGenJS from 'pptxgenjs'
import { mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { getLocale } from './presentation-content.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const lang = process.argv[2] === 'id' ? 'id' : 'en'
const t = getLocale(lang)
const OUT = join(__dirname, '../docs', t.meta.outfile)

const C = {
  bg: '141414',
  card: '1F1F1F',
  red: 'E31837',
  redDark: 'B5122C',
  white: 'FFFFFF',
  muted: 'B0B0B0',
  border: '333333',
  green: '22C55E',
  yellow: 'EAB308',
  blue: '3B82F6',
}

const pptx = new PptxGenJS()
pptx.layout = 'LAYOUT_16x9'
pptx.author = 'ExxonMobil Cepu Limited'
pptx.title = t.meta.title
pptx.subject = t.meta.subject

function slideBg(slide) {
  slide.background = { color: C.bg }
}

function addHeader(slide, title, subtitle) {
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: '100%', h: 0.08,
    fill: { color: C.red }, line: { color: C.red },
  })
  slide.addText(title, {
    x: 0.5, y: 0.35, w: 9, h: 0.7,
    fontSize: 28, bold: true, color: C.white, fontFace: 'Arial',
  })
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.5, y: 1.05, w: 9, h: 0.4,
      fontSize: 14, color: C.muted, fontFace: 'Arial',
    })
  }
}

function addFooter(slide) {
  slide.addText(t.footer, {
    x: 0.5, y: 5.25, w: 9, h: 0.3,
    fontSize: 9, color: C.muted, fontFace: 'Arial',
  })
}

function addBullets(slide, items, opts = {}) {
  const bullets = items.map((text) => ({ text, options: { bullet: true, breakLine: true } }))
  slide.addText(bullets, {
    x: opts.x ?? 0.5, y: opts.y ?? 1.6, w: opts.w ?? 9, h: opts.h ?? 3.5,
    fontSize: opts.fontSize ?? 14, color: C.white, fontFace: 'Arial', valign: 'top',
  })
}

function addBox(slide, x, y, w, h, label, sub, color = C.red) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    fill: { color: C.card }, line: { color, pt: 1.5 }, rectRadius: 0.08,
  })
  slide.addText(label, {
    x, y: y + 0.12, w, h: 0.35,
    fontSize: 12, bold: true, color: C.white, align: 'center', fontFace: 'Arial',
  })
  if (sub) {
    slide.addText(sub, {
      x, y: y + 0.45, w, h: h - 0.5,
      fontSize: 9, color: C.muted, align: 'center', fontFace: 'Arial',
    })
  }
}

function arrow(slide, x1, y1, x2, y2) {
  slide.addShape(pptx.ShapeType.line, {
    x: x1, y: y1, w: x2 - x1, h: y2 - y1,
    line: { color: C.red, width: 2, endArrowType: 'triangle' },
  })
}

// Slide 1
{
  const s = pptx.addSlide()
  slideBg(s)
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 2.2, w: '100%', h: 0.06, fill: { color: C.red } })
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.8, y: 0.9, w: 0.9, h: 0.9,
    fill: { color: C.red }, line: { color: C.red }, rectRadius: 0.1,
  })
  s.addText('EM', {
    x: 0.8, y: 0.95, w: 0.9, h: 0.8,
    fontSize: 28, bold: true, color: C.white, align: 'center', fontFace: 'Arial',
  })
  s.addText(t.s1.title, {
    x: 0.8, y: 2.5, w: 8.5, h: 1.2,
    fontSize: 36, bold: true, color: C.white, fontFace: 'Arial',
  })
  s.addText(t.s1.subtitle, {
    x: 0.8, y: 3.7, w: 8, h: 0.5,
    fontSize: 16, color: C.muted, fontFace: 'Arial',
  })
  s.addText(t.s1.date, {
    x: 0.8, y: 4.8, w: 8, h: 0.4,
    fontSize: 12, color: C.muted, fontFace: 'Arial',
  })
}

// Slide 2
{
  const s = pptx.addSlide()
  slideBg(s)
  addHeader(s, t.s2.h, t.s2.sub)
  const vals = ['13', '3', '4+', '100%']
  t.s2.metrics.forEach((l, i) => {
    const x = 0.5 + i * 2.35
    s.addShape(pptx.ShapeType.roundRect, {
      x, y: 1.7, w: 2.1, h: 1.2,
      fill: { color: C.card }, line: { color: C.red, pt: 1 }, rectRadius: 0.06,
    })
    s.addText(vals[i], { x, y: 1.85, w: 2.1, h: 0.55, fontSize: 32, bold: true, color: C.red, align: 'center', fontFace: 'Arial' })
    s.addText(l, { x, y: 2.45, w: 2.1, h: 0.35, fontSize: 11, color: C.muted, align: 'center', fontFace: 'Arial' })
  })
  addBullets(s, t.s2.bullets, { y: 3.2, fontSize: 13 })
  addFooter(s)
}

// Slide 3
{
  const s = pptx.addSlide()
  slideBg(s)
  addHeader(s, t.s3.h, t.s3.sub)
  t.s3.rows.forEach((row, i) => {
    const y = 1.65 + i * 0.72
    s.addShape(pptx.ShapeType.rect, { x: 0.5, y, w: 4.2, h: 0.58, fill: { color: C.card }, line: { color: C.border } })
    s.addText(row[0], { x: 0.6, y: y + 0.1, w: 4, h: 0.4, fontSize: 12, bold: true, color: C.white, fontFace: 'Arial' })
    s.addShape(pptx.ShapeType.rect, { x: 5.0, y, w: 4.5, h: 0.58, fill: { color: '2A1518' }, line: { color: C.redDark } })
    s.addText(row[1], { x: 5.1, y: y + 0.1, w: 4.3, h: 0.4, fontSize: 11, color: C.muted, fontFace: 'Arial' })
  })
  addFooter(s)
}

// Slide 4
{
  const s = pptx.addSlide()
  slideBg(s)
  addHeader(s, t.s4.h, t.s4.sub)
  t.s4.steps.forEach((st, i) => {
    const x = 0.45 + i * 2.4
    addBox(s, x, 2.0, 2.1, 1.3, st[0], st[1])
    if (i < 3) arrow(s, x + 2.15, 2.65, x + 2.35, 2.65)
  })
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.5, y: 3.6, w: 9, h: 1.3,
    fill: { color: '1A1214' }, line: { color: C.red, pt: 1 }, rectRadius: 0.06,
  })
  s.addText(t.s4.banner, {
    x: 0.7, y: 3.85, w: 8.6, h: 0.8,
    fontSize: 13, color: C.white, align: 'center', fontFace: 'Arial',
  })
  addFooter(s)
}

// Slide 5
{
  const s = pptx.addSlide()
  slideBg(s)
  addHeader(s, t.s5.h, t.s5.sub)
  const colors = [C.blue, C.yellow, C.red]
  t.s5.roles.forEach((r, i) => {
    const x = 0.5 + i * 3.15
    s.addShape(pptx.ShapeType.roundRect, {
      x, y: 1.7, w: 2.9, h: 3.0,
      fill: { color: C.card }, line: { color: colors[i], pt: 2 }, rectRadius: 0.08,
    })
    s.addText(r.t, { x, y: 1.9, w: 2.9, h: 0.4, fontSize: 16, bold: true, color: colors[i], align: 'center', fontFace: 'Arial' })
    s.addText(r.items, { x: x + 0.15, y: 2.5, w: 2.6, h: 2.0, fontSize: 12, color: C.white, fontFace: 'Arial', valign: 'top' })
  })
  addFooter(s)
}

// Slide 6
{
  const s = pptx.addSlide()
  slideBg(s)
  addHeader(s, t.s6.h, t.s6.sub)
  t.s6.flow.forEach((f, i) => {
    const x = 0.35 + i * 1.55
    addBox(s, x, 2.1, 1.35, 0.75, f, null, i === 4 ? C.green : C.border)
    if (i < 5) arrow(s, x + 1.38, 2.48, x + 1.52, 2.48)
  })
  addBullets(s, t.s6.bullets, { y: 3.2, fontSize: 12 })
  addFooter(s)
}

// Slide 7
{
  const s = pptx.addSlide()
  slideBg(s)
  addHeader(s, t.s7.h, t.s7.sub)
  const b = t.s7.boxes
  addBox(s, 0.8, 1.8, 2.2, 1.0, b[0][0], b[0][1])
  arrow(s, 3.05, 2.3, 3.35, 2.3)
  addBox(s, 3.4, 1.8, 2.2, 1.0, b[1][0], b[1][1])
  arrow(s, 5.65, 2.3, 5.95, 2.3)
  addBox(s, 6.0, 1.65, 1.5, 0.7, b[2][0], b[2][1], C.green)
  addBox(s, 6.0, 2.45, 1.5, 0.7, b[3][0], b[3][1], C.red)
  arrow(s, 7.55, 2.3, 7.85, 2.3)
  addBox(s, 7.9, 1.8, 1.5, 1.0, b[4][0], b[4][1])
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.8, y: 3.3, w: 8.6, h: 1.5,
    fill: { color: C.card }, line: { color: C.border }, rectRadius: 0.06,
  })
  s.addText(t.s7.note, { x: 1.0, y: 3.55, w: 8.2, h: 1.0, fontSize: 12, color: C.muted, fontFace: 'Arial' })
  addFooter(s)
}

// Slide 8
{
  const s = pptx.addSlide()
  slideBg(s)
  addHeader(s, t.s8.h, t.s8.sub)
  t.s8.types.forEach((type, i) => {
    const x = 0.5 + i * 3.15
    addBox(s, x, 1.7, 2.9, 1.4, type.t, type.d, C.red)
  })
  s.addText(t.s8.checksLabel, { x: 0.5, y: 3.3, w: 3, h: 0.3, fontSize: 13, bold: true, color: C.white, fontFace: 'Arial' })
  addBullets(s, t.s8.bullets, { y: 3.6, fontSize: 12 })
  s.addText(t.s8.timeline, { x: 0.5, y: 4.35, w: 3, h: 0.25, fontSize: 11, color: C.muted, fontFace: 'Arial' })
  s.addShape(pptx.ShapeType.rect, { x: 0.5, y: 4.65, w: 3, h: 0.25, fill: { color: C.red }, line: { color: C.red } })
  s.addText(t.s8.existing, { x: 0.5, y: 4.95, w: 3, h: 0.2, fontSize: 8, color: C.muted, align: 'center', fontFace: 'Arial' })
  s.addShape(pptx.ShapeType.rect, { x: 2.0, y: 4.65, w: 2.5, h: 0.25, fill: { color: C.yellow }, line: { color: C.yellow } })
  s.addText(t.s8.newReq, { x: 2.0, y: 4.95, w: 2.5, h: 0.2, fontSize: 8, color: C.muted, align: 'center', fontFace: 'Arial' })
  addFooter(s)
}

// Slide 9
{
  const s = pptx.addSlide()
  slideBg(s)
  addHeader(s, t.s9.h, t.s9.sub)
  addBox(s, 2.5, 1.65, 5.0, 0.7, t.s9.browser, null, C.border)
  arrow(s, 4.9, 2.38, 4.9, 2.58)
  addBox(s, 1.5, 2.65, 7.0, 1.1, t.s9.app[0], t.s9.app[1])
  arrow(s, 3.5, 3.78, 2.0, 4.05)
  arrow(s, 4.9, 3.78, 4.9, 4.05)
  arrow(s, 6.3, 3.78, 7.8, 4.05)
  t.s9.bottom.forEach((box, i) => {
    addBox(s, 0.5 + i * 3.1, 4.1, 2.8, 0.85, box[0], box[1])
  })
  s.addText(t.s9.hosting, { x: 0.5, y: 5.05, w: 9, h: 0.3, fontSize: 10, color: C.muted, align: 'center', fontFace: 'Arial' })
  addFooter(s)
}

// Slide 10
{
  const s = pptx.addSlide()
  slideBg(s)
  addHeader(s, t.s10.h, t.s10.sub)
  t.s10.groups.forEach((g, i) => {
    addBox(s, 0.5 + i * 3.15, 1.7, 2.9, 2.2, g.t, g.items)
  })
  s.addText(t.s10.index, { x: 0.5, y: 4.1, w: 9, h: 0.35, fontSize: 11, color: C.muted, align: 'center', fontFace: 'Arial' })
  addFooter(s)
}

// Slide 11
{
  const s = pptx.addSlide()
  slideBg(s)
  addHeader(s, t.s11.h, t.s11.sub)
  t.s11.features.forEach((f, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = 0.5 + col * 4.75
    const y = 1.6 + row * 0.85
    s.addShape(pptx.ShapeType.rect, { x, y, w: 4.5, h: 0.72, fill: { color: C.card }, line: { color: C.border } })
    s.addText('✓', { x: x + 0.1, y: y + 0.15, w: 0.3, h: 0.4, fontSize: 14, bold: true, color: C.green, fontFace: 'Arial' })
    s.addText(f[0], { x: x + 0.4, y: y + 0.08, w: 4.0, h: 0.3, fontSize: 12, bold: true, color: C.white, fontFace: 'Arial' })
    s.addText(f[1], { x: x + 0.4, y: y + 0.38, w: 4.0, h: 0.3, fontSize: 10, color: C.muted, fontFace: 'Arial' })
  })
  addFooter(s)
}

// Slide 12
{
  const s = pptx.addSlide()
  slideBg(s)
  addHeader(s, t.s12.h, t.s12.sub)
  t.s12.screens.forEach((sc, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = 0.5 + col * 4.75
    const y = 1.55 + row * 1.15
    s.addShape(pptx.ShapeType.roundRect, {
      x, y, w: 4.5, h: 0.95,
      fill: { color: '1A1214' }, line: { color: C.red, pt: 1 }, rectRadius: 0.05,
    })
    s.addText(`${i + 1}. ${sc}`, { x: x + 0.15, y: y + 0.2, w: 4.2, h: 0.6, fontSize: 11, color: C.white, fontFace: 'Arial' })
  })
  addFooter(s)
}

// Slide 13
{
  const s = pptx.addSlide()
  slideBg(s)
  addHeader(s, t.s13.h, t.s13.sub)
  t.s13.rows.forEach((row, i) => {
    const y = 1.6 + i * 0.62
    s.addText(row[0], { x: 0.5, y, w: 2.2, h: 0.45, fontSize: 12, bold: true, color: C.red, fontFace: 'Arial' })
    s.addText(row[1], { x: 2.8, y, w: 6.7, h: 0.45, fontSize: 11, color: C.white, fontFace: 'Arial' })
  })
  addFooter(s)
}

// Slide 14
{
  const s = pptx.addSlide()
  slideBg(s)
  addHeader(s, t.s14.h, t.s14.sub)
  const colors = [C.red, C.blue, C.green, C.yellow]
  t.s14.phases.forEach((p, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = 0.5 + col * 4.75
    const y = 1.55 + row * 1.95
    s.addShape(pptx.ShapeType.roundRect, {
      x, y, w: 4.5, h: 1.75,
      fill: { color: C.card }, line: { color: colors[i], pt: 2 }, rectRadius: 0.06,
    })
    s.addText(p.phase, { x: x + 0.15, y: y + 0.12, w: 4.2, h: 0.35, fontSize: 12, bold: true, color: colors[i], fontFace: 'Arial' })
    s.addText(p.items, { x: x + 0.15, y: y + 0.5, w: 4.2, h: 1.1, fontSize: 10, color: C.white, fontFace: 'Arial', valign: 'top' })
  })
  addFooter(s)
}

// Slide 15
{
  const s = pptx.addSlide()
  slideBg(s)
  addHeader(s, t.s15.h, t.s15.sub)
  addBox(s, 3.5, 1.65, 3.0, 0.65, 'project table', 'code, name, site, status')
  arrow(s, 4.2, 2.33, 2.0, 2.75)
  arrow(s, 5.0, 2.33, 5.0, 2.75)
  arrow(s, 5.8, 2.33, 8.0, 2.75)
  addBox(s, 0.8, 2.8, 2.4, 0.75, 'reservation', 'projectId FK')
  addBox(s, 3.8, 2.8, 2.4, 0.75, 'user_role', 'project scope')
  addBox(s, 6.8, 2.8, 2.4, 0.75, 'reports', 'filter by project')
  addBullets(s, t.s15.bullets, { y: 3.8, fontSize: 12 })
  addFooter(s)
}

// Slide 16
{
  const s = pptx.addSlide()
  slideBg(s)
  addHeader(s, t.s16.h, t.s16.sub)
  addBox(s, 3.2, 1.65, 3.6, 0.8, t.s16.center[0], t.s16.center[1])
  const positions = [[0.5, 2.9], [5.0, 2.9], [0.5, 4.1], [5.0, 4.1]]
  t.s16.integrations.forEach((int, i) => {
    const [x, y] = positions[i]
    addBox(s, x, y, 4.0, 0.95, int[0], int[1], C.blue)
    const cx = 3.5 + (i % 2) * 0.5
    const cy = 2.05 + Math.floor(i / 2) * 1.2
    arrow(s, x + 2.0, y, cx, cy + 0.4)
  })
  addFooter(s)
}

// Slide 17
{
  const s = pptx.addSlide()
  slideBg(s)
  addHeader(s, t.s17.h, t.s17.sub)
  t.s17.benefits.forEach((b, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = 0.5 + col * 4.75
    const y = 1.6 + row * 1.15
    s.addShape(pptx.ShapeType.roundRect, {
      x, y, w: 4.5, h: 0.95,
      fill: { color: C.card }, line: { color: C.red, pt: 1 }, rectRadius: 0.05,
    })
    s.addText(b[0], { x: x + 0.15, y: y + 0.1, w: 4.2, h: 0.35, fontSize: 13, bold: true, color: C.white, fontFace: 'Arial' })
    s.addText(b[1], { x: x + 0.15, y: y + 0.48, w: 4.2, h: 0.4, fontSize: 11, color: C.muted, fontFace: 'Arial' })
  })
  addFooter(s)
}

// Slide 18
{
  const s = pptx.addSlide()
  slideBg(s)
  addHeader(s, t.s18.h, t.s18.sub)
  t.s18.timeline.forEach((item, i) => {
    const y = 1.55 + i * 0.72
    s.addShape(pptx.ShapeType.rect, { x: 0.5, y, w: 1.3, h: 0.55, fill: { color: C.red }, line: { color: C.red } })
    s.addText(item.w, { x: 0.5, y: y + 0.12, w: 1.3, h: 0.35, fontSize: 10, bold: true, color: C.white, align: 'center', fontFace: 'Arial' })
    s.addText(item.t, { x: 2.0, y: y + 0.05, w: 2.5, h: 0.35, fontSize: 13, bold: true, color: C.white, fontFace: 'Arial' })
    s.addText(item.d, { x: 4.6, y: y + 0.1, w: 5.0, h: 0.4, fontSize: 11, color: C.muted, fontFace: 'Arial' })
    if (i < 4) {
      s.addShape(pptx.ShapeType.line, { x: 1.15, y: y + 0.58, w: 0, h: 0.12, line: { color: C.red, width: 2 } })
    }
  })
  addFooter(s)
}

// Slide 19
{
  const s = pptx.addSlide()
  slideBg(s)
  addHeader(s, t.s19.h, t.s19.sub)
  t.s19.demo.forEach((d, i) => {
    s.addText(d, { x: 0.7, y: 1.55 + i * 0.45, w: 8.5, h: 0.4, fontSize: 13, color: C.white, fontFace: 'Arial' })
  })
  addFooter(s)
}

// Slide 20
{
  const s = pptx.addSlide()
  slideBg(s)
  addHeader(s, t.s20.h, t.s20.sub)
  addBullets(s, t.s20.bullets, { y: 1.6, fontSize: 14 })
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.5, y: 4.2, w: 9, h: 0.8,
    fill: { color: '1A1214' }, line: { color: C.red, pt: 1.5 }, rectRadius: 0.06,
  })
  s.addText(t.s20.contact, {
    x: 0.5, y: 4.4, w: 9, h: 0.4,
    fontSize: 14, bold: true, color: C.white, align: 'center', fontFace: 'Arial',
  })
  addFooter(s)
}

// Slide 21
{
  const s = pptx.addSlide()
  slideBg(s)
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 2.4, w: '100%', h: 0.06, fill: { color: C.red } })
  s.addText(t.s21.h, {
    x: 0.5, y: 2.0, w: 9, h: 0.8,
    fontSize: 40, bold: true, color: C.white, align: 'center', fontFace: 'Arial',
  })
  s.addText(t.s21.sub, {
    x: 0.5, y: 3.0, w: 9, h: 0.5,
    fontSize: 18, color: C.muted, align: 'center', fontFace: 'Arial',
  })
  s.addShape(pptx.ShapeType.roundRect, {
    x: 4.3, y: 1.0, w: 1.4, h: 1.4,
    fill: { color: C.red }, line: { color: C.red }, rectRadius: 0.12,
  })
  s.addText('EM', {
    x: 4.3, y: 1.15, w: 1.4, h: 1.1,
    fontSize: 36, bold: true, color: C.white, align: 'center', fontFace: 'Arial',
  })
  addFooter(s)
}

mkdirSync(join(__dirname, '../docs'), { recursive: true })
await pptx.writeFile({ fileName: OUT })
console.log(`Created (${lang}):`, OUT)
