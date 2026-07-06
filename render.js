const FLAG_CODE = {
  'Mexico': 'mx', 'South Korea': 'kr', 'South Africa': 'za', 'Czechia': 'cz',
  'Canada': 'ca', 'Switzerland': 'ch', 'Qatar': 'qa', 'Bosnia and Herzegovina': 'ba',
  'Brazil': 'br', 'Morocco': 'ma', 'Scotland': 'gb-sct', 'Haiti': 'ht',
  'United States': 'us', 'Australia': 'au', 'Paraguay': 'py', 'Turkiye': 'tr',
  'Germany': 'de', 'Ecuador': 'ec', 'Ivory Coast': 'ci', 'Curacao': 'cw',
  'Netherlands': 'nl', 'Japan': 'jp', 'Tunisia': 'tn', 'Sweden': 'se',
  'Belgium': 'be', 'Iran': 'ir', 'Egypt': 'eg', 'New Zealand': 'nz',
  'Spain': 'es', 'Uruguay': 'uy', 'Saudi Arabia': 'sa', 'Cape Verde': 'cv',
  'France': 'fr', 'Senegal': 'sn', 'Norway': 'no', 'Iraq': 'iq',
  'Argentina': 'ar', 'Austria': 'at', 'Algeria': 'dz', 'Jordan': 'jo',
  'Portugal': 'pt', 'Colombia': 'co', 'Uzbekistan': 'uz', 'DR Congo': 'cd',
  'England': 'gb-eng', 'Croatia': 'hr', 'Ghana': 'gh', 'Panama': 'pa',
}

const SHORT = {
  'Bosnia and Herzegovina': 'Bosnia & Herz.', 'United States': 'United States',
}

const BRACKET_LEFT = { r32: [75, 78, 73, 76, 74, 77, 79, 80], r16: [89, 90, 91, 92], qf: [97, 98], sf: [101] }
const BRACKET_RIGHT = { r32: [83, 84, 81, 82, 87, 86, 88, 85], r16: [93, 94, 95, 96], qf: [99, 100], sf: [102] }

function flag(team) { const c = FLAG_CODE[team]; return c ? `<span class="fi fi-${c}"></span>` : '🏳️' }
function short(team) { return SHORT[team] || team }

function esc(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
}

const DAYS_RU = ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота']
const MONTHS_RU = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const dd = d.getDate()
  const mo = MONTHS_RU[d.getMonth()]
  const dow = DAYS_RU[d.getDay()]
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${dd} ${mo} (${dow}), ${hh}:${mm}`
}

function shortTz() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const parts = tz.split('/')
  const name = parts.length > 1 ? parts.slice(1).join('/').replace(/_/g, ' ') : tz
  const now = new Date()
  const off = -now.getTimezoneOffset()
  const hh = String(Math.abs(Math.floor(off / 60))).padStart(2, '0')
  const mm = String(Math.abs(off % 60)).padStart(2, '0')
  const sign = off >= 0 ? '+' : '-'
  return `${name} (UTC${sign}${hh}:${mm})`
}

function penText(m) {
  if (m.decidedBy === 'penalties') return `${m.penHome}–${m.penAway} по пенальти`
  if (m.decidedBy === 'extra_time') return 'после овертайма'
  return ''
}

function teamLine(team, goals, won, pens) {
  const cls = won ? 'font-bold text-[var(--ink)]' : 'text-[var(--ink)] opacity-60'
  const pen = pens != null ? `<span class="pen-score">(${pens})</span>` : ''
  return `<div class="flex items-baseline gap-1.5 min-w-0">
    <span class="text-sm shrink-0">${flag(team)}</span>
    <span class="truncate text-[0.8rem] ${cls}">${esc(short(team))}</span>
    <span class="leader"></span>
    ${pen}<span class="score">${goals}</span>
  </div>`
}

function matchCard(m, opts = {}) {
  const homeWon = m.winner === m.home
  const tag = penText(m)
  const isCompleted = m.status === 'completed'
  const statusClass = isCompleted ? 'match-completed' : 'match-predicted'
  const votes = m.panelVotes ? `<span class="opacity-70">состав: ${esc(m.panelVotes.replace(m.winner, '').trim())} за ${esc(short(m.winner))}</span>` : ''
  const note = opts.showNote && m.note ? `<p class="mt-1 text-[0.68rem] leading-snug italic opacity-75">${esc(m.note)}</p>` : ''
  const dateHtml = m.date ? `<span class="text-[0.55rem] opacity-50">${esc(formatDate(m.date))}</span>` : ''
  return `<div class="match-card ${statusClass} ${opts.extraClass || ''}" ${m.note && !opts.showNote ? `title="${esc(m.note)}"` : ''}>
    <div class="flex justify-between text-[0.6rem] uppercase tracking-[0.12em] opacity-60 mb-1">
      <span>M${m.match}</span><span>${esc(opts.caption || '')}</span>
    </div>
    ${teamLine(m.home, m.homeGoals, homeWon, m.decidedBy === 'penalties' ? m.penHome : null)}
    ${teamLine(m.away, m.awayGoals, !homeWon, m.decidedBy === 'penalties' ? m.penAway : null)}
    ${tag || votes ? `<div class="mt-1 text-[0.62rem] uppercase tracking-wider opacity-70 flex gap-2">${tag ? `<span>${tag}</span>` : ''}${votes}</div>` : ''}
    ${note}
    <div class="flex justify-between mt-1">${dateHtml}<span class="text-[0.55rem] uppercase tracking-wider ${isCompleted ? 'text-green-700' : 'text-amber-600'}">${isCompleted ? '✓ сыгран' : '⚽ прогноз'}</span></div>
  </div>`
}

const ko = (T, n) => T.knockout.find(m => m.match === n)

function column(T, nums, caption) {
  return `<div class="flex flex-col justify-around gap-2">${nums.map(n => matchCard(ko(T, n), { caption })).join('')}</div>`
}

function renderBracket(T) {
  const final = ko(T, 104), third = ko(T, 103)
  const center = `<div class="flex flex-col justify-center gap-6">
    <div>
      <p class="text-center text-[0.65rem] uppercase tracking-[0.25em] mb-2 opacity-70">Финал · MetLife Stadium · ${esc(formatDate(ko(T, 104).date))}</p>
      ${matchCard(final, { caption: 'Финал', showNote: true, extraClass: 'final-card' })}
      <div class="stamp-wrap"><div class="stamp">${flag(T.champion)} ${esc(T.champion)}<span>Чемпионы мира 2026</span></div></div>
    </div>
    <div>
      <p class="text-center text-[0.65rem] uppercase tracking-[0.25em] mb-2 opacity-70">Матч за 3-е место · ${esc(formatDate(ko(T, 103).date))}</p>
      ${matchCard(third, { caption: 'Бронза', showNote: true })}
    </div>
  </div>`
  return `<div class="overflow-x-auto"><div class="bracket-grid min-w-[1140px]">
    ${column(T, BRACKET_LEFT.r32, '1/16')}
    ${column(T, BRACKET_LEFT.r16, '1/8')}
    ${column(T, BRACKET_LEFT.qf, '1/4')}
    ${column(T, BRACKET_LEFT.sf, '1/2')}
    ${center}
    ${column(T, BRACKET_RIGHT.sf, '1/2')}
    ${column(T, BRACKET_RIGHT.qf, '1/4')}
    ${column(T, BRACKET_RIGHT.r16, '1/8')}
    ${column(T, BRACKET_RIGHT.r32, '1/16')}
  </div></div>`
}

function renderGroups(T) {
  const qualified = new Set(T.qualifiedThirds)
  const panels = Object.entries(T.groups).map(([letter, g]) => {
    const rows = g.standings.map((r, i) => {
      const advanced = i < 2 || (i === 2 && qualified.has(letter))
      return `<tr class="${advanced ? 'font-semibold' : 'opacity-55'}">
        <td class="pr-1">${i + 1}</td>
        <td class="text-left w-full"><span class="mr-1">${flag(r.team)}</span>${esc(short(r.team))}${i === 2 && qualified.has(letter) ? ' <span class="q-mark">q</span>' : ''}</td>
        <td>${r.w}</td><td>${r.d}</td><td>${r.l}</td>
        <td>${r.gf}:${r.ga}</td><td class="font-bold">${r.pts}</td>
      </tr>`
    }).join('')
    const matches = g.matches.map(m => {
      const isCompleted = m.status === 'completed'
      return `<div class="grid grid-cols-[auto_1fr_auto_1fr_auto] gap-x-1 text-[0.72rem] items-baseline ${isCompleted ? 'opacity-90' : 'opacity-100'}" title="${esc(m.note || '')}">
        <span class="text-[0.5rem] opacity-50">${esc(formatDate(m.date) || '')}</span>
        <span class="truncate text-right">${flag(m.home)} ${esc(short(m.home))}</span>
        <span class="score score-sm text-center mx-0.5 min-w-[2.5ch]">${m.homeGoals}–${m.awayGoals}</span>
        <span class="truncate">${flag(m.away)} ${esc(short(m.away))}</span>
        <span class="text-[0.45rem] uppercase tracking-wider text-right ${isCompleted ? 'text-green-700' : 'text-amber-600'}">${isCompleted ? '✓ сыгран' : '⚽ прогноз'}</span>
      </div>`
    }).join('')
    return `<section class="group-panel">
      <h3 class="panel-title">Группа ${letter}</h3>
      <table class="w-full text-[0.72rem] tabular-nums text-center border-collapse">
        <thead><tr class="text-[0.6rem] uppercase tracking-wider opacity-60">
          <th></th><th class="text-left">Команда</th><th>В</th><th>Н</th><th>П</th><th>Голы</th><th>О</th>
        </tr></thead><tbody>${rows}</tbody>
      </table>
      <div class="mt-2 pt-2 border-t border-dotted border-[var(--rule)] flex flex-col gap-1">${matches}</div>
    </section>`
  }).join('')
  return `<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">${panels}</div>`
}

function renderThirds(T) {
  const cells = T.thirdPlaceRanking.map((t, i) => `<div class="third-cell ${i < 8 ? '' : 'opacity-45'}">
    <span class="text-[0.65rem] opacity-60">${i + 1}.</span>
    <span>${flag(t.team)}</span>
    <span class="text-[0.75rem] ${i < 8 ? 'font-semibold' : ''}">${esc(short(t.team))}</span>
    <span class="text-[0.7rem] tabular-nums opacity-70">${t.pts} pts, ${t.gf - t.ga > 0 ? '+' : ''}${t.gf - t.ga}</span>
    ${i < 8 ? '<span class="q-mark">q</span>' : ''}
  </div>`).join('')
  return `<div class="grid gap-x-6 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">${cells}</div>`
}

function computeStats(T) {
  const groupMatches = Object.values(T.groups).flatMap(g => g.matches)
  const koMatches = T.knockout
  const all = [...groupMatches, ...koMatches]
  const goals = all.reduce((s, m) => s + m.homeGoals + m.awayGoals, 0)
  const draws = groupMatches.filter(m => m.homeGoals === m.awayGoals).length
  const pens = koMatches.filter(m => m.decidedBy === 'penalties').length
  const aet = koMatches.filter(m => m.decidedBy === 'extra_time').length
  let biggest = all[0], margin = -1
  for (const m of all) {
    const d = Math.abs(m.homeGoals - m.awayGoals)
    if (d > margin) { margin = d; biggest = m }
  }
  return { matches: all.length, goals, avg: (goals / all.length).toFixed(2), draws, pens, aet, biggest }
}

function renderStats(T) {
  const s = computeStats(T)
  const b = s.biggest
  return `<dl class="grid gap-x-8 gap-y-1 sm:grid-cols-2 text-[0.8rem]">
    ${[['Всего матчей', s.matches], ['Голы', `${s.goals} (${s.avg} за матч)`],
      ['Ничьи в группах', s.draws], ['Овертаймы', s.aet],
      ['Пенальти', s.pens],
      ['Крупнейшая победа', `${short(b.home)} ${b.homeGoals}–${b.awayGoals} ${short(b.away)}`]]
      .map(([k, v]) => `<div class="flex items-baseline gap-2"><dt class="opacity-70">${k}</dt><span class="leader"></span><dd class="font-semibold tabular-nums">${v}</dd></div>`).join('')}
  </dl>`
}

function renderAll(T, runId) {
  if (!T) return `<p class="p-12 text-center italic opacity-70">Сетка всё ещё у печатника…</p>`
  return `
  <header class="masthead">
    <p class="text-[0.7rem] uppercase tracking-[0.35em] opacity-70">США · Мексика · Канада — 11 июня – 19 июля 2026 · время местное (<span id="tz-indicator">${esc(shortTz())}</span>)</p>
    <h1>Чемпионат мира 2026<span> · Полная турнирная таблица с прогнозами</span></h1>
    <p class="mt-1 text-[0.8rem] opacity-80 max-w-[70ch] mx-auto">Все 104 матча спрогнозированы до старта турнира флотом из 50 агентов Claude — предсказатели групп, аналитики плей-офф и судейская коллегия для полуфиналов и финала. Счета проставлены вручную. Ни один матч не пострадал.</p>
  </header>

  <section class="mt-8">
    <h2 class="section-title">Путь к финалу — сетка плей-офф</h2>
    ${renderBracket(T)}
  </section>

  <section class="mt-10">
    <h2 class="section-title">Групповой этап — 72 матча, 12 групп</h2>
    ${renderGroups(T)}
  </section>

  <div class="mt-10 grid gap-8 lg:grid-cols-2">
    <section>
      <h2 class="section-title">Лучшие третьи команды <span class="normal-case tracking-normal opacity-60 text-[0.75rem]">(топ-8 проходят)</span></h2>
      ${renderThirds(T)}
    </section>
    <section>
      <h2 class="section-title">В цифрах</h2>
      ${renderStats(T)}
    </section>
  </div>

  <footer class="mt-12 pt-4 border-t-2 border-[var(--ink)] flex flex-wrap justify-between gap-2 text-[0.65rem] uppercase tracking-[0.18em] opacity-70">
    <span>Print Nº ${esc(runId || 'WF-0000')}</span>
    <span>Predicted by Claude (Fable 5) · multi-agent workflow</span>
    <span>Not a betting slip</span>
  </footer>`
}
