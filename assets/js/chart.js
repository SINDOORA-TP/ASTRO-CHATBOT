/**
 * chart.js – KP Astrology Chart Engine
 * Requires window.Astronomy (astronomy.min.js) to be loaded before use.
 */

'use strict';

/* ----------------------- KP DATA CONSTANTS ----------------------- */

const ORDER = ['Ke', 'Ve', 'Su', 'Mo', 'Ma', 'Ra', 'Ju', 'Sa', 'Me'];
const _ORDER = ['Ke', 'Ve', 'Su', 'Mo', 'Ma', 'Ra', 'Ju', 'Sa', 'Me'];

const NAME = {
  Ke: 'Ketu', Ve: 'Venus', Su: 'Sun', Mo: 'Moon',
  Ma: 'Mars', Ra: 'Rahu', Ju: 'Jupiter', Sa: 'Saturn', Me: 'Mercury'
};

const YEARS = { Ke: 7, Ve: 20, Su: 6, Mo: 10, Ma: 7, Ra: 18, Ju: 16, Sa: 19, Me: 17 };

const HUE = { Ke: 25, Ve: 330, Su: 40, Mo: 178, Ma: 2, Ra: 268, Ju: 75, Sa: 225, Me: 145 };

const SIGNS = [
  ['Aries', 'Ma'], ['Taurus', 'Ve'], ['Gemini', 'Me'], ['Cancer', 'Mo'],
  ['Leo', 'Su'], ['Virgo', 'Me'], ['Libra', 'Ve'], ['Scorpio', 'Ma'],
  ['Sagittarius', 'Ju'], ['Capricorn', 'Sa'], ['Aquarius', 'Sa'], ['Pisces', 'Ju']
];

const TLAG = [
  'Mesha', 'Vrishabha', 'Mithuna', 'Kataka',
  'Simha', 'Kanya', 'Tula', 'Vrischika',
  'Dhanus', 'Makara', 'Kumbha', 'Meena'
];

const NAKS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta',
  'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

const CODES = ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke'];

const BODY = {
  Su: 'Sun', Mo: 'Moon', Ma: 'Mars', Me: 'Mercury',
  Ju: 'Jupiter', Ve: 'Venus', Sa: 'Saturn'
};

const CELL = {
  11: [0, 0], 0: [1, 0], 1: [2, 0], 2: [3, 0],
  3: [3, 1], 4: [3, 2], 5: [3, 3], 6: [2, 3],
  7: [1, 3], 8: [0, 3], 9: [0, 2], 10: [0, 1]
};

const rad = d => (d * Math.PI) / 180;
const deg = r => (r * 180) / Math.PI;
const mod = (a, n) => ((a % n) + n) % n;

const NAKS_LORDS = NAKS.map((_, i) => _ORDER[i % 9]);

/* ----------------------- 249 KP TABLE ----------------------- */

function buildTable() {
  const N = 360 / 27;
  const base = [];
  for (let n = 0; n < 27; n++) {
    const si = n % 9;
    let pos = n * N;
    for (let j = 0; j < 9; j++) {
      const sub = _ORDER[(si + j) % 9];
      const len = (N * YEARS[sub]) / 120;
      base.push({ s: pos, e: pos + len, star: _ORDER[si], sub, nak: n });
      pos += len;
    }
  }
  base[base.length - 1].e = 360;

  const out = [];
  for (const g of base) {
    let s = g.s;
    for (let b = Math.floor((g.s + 1e-9) / 30) + 1; b * 30 < g.e - 1e-9; b++) {
      out.push(Object.assign({}, g, { s: s, e: b * 30 }));
      s = b * 30;
    }
    out.push(Object.assign({}, g, { s: s, e: g.e }));
  }

  out.forEach((g, i) => {
    g.i = i + 1;
    g.sign = Math.min(11, Math.floor((g.s + 1e-9) / 30));
    g.lord = SIGNS[g.sign][1];
  });
  return out;
}

const SEGS = buildTable();

function findSeg(a) {
  let lo = 0;
  let hi = SEGS.length - 1;
  while (lo < hi) {
    const m = (lo + hi + 1) >> 1;
    if (SEGS[m].s <= a) lo = m;
    else hi = m - 1;
  }
  return lo;
}

/* ----------------------- ASTRONOMY MATH ----------------------- */

function ayanamsa(jd, kind = 'lahiri') {
  const c = (jd - 2451545) / 36525;
  if (kind === 'lahiri') return 23.853056 + c * 1.396944;
  return 23.760833 + c * 1.396944; // KP
}

function sidAsc(ms, lat, lon, kind = 'lahiri') {
  const jd = ms / 86400000 + 2440587.5;
  const d = jd - 2451545;
  const T = d / 36525;
  const gmst = 280.46061837 + 360.98564736629 * d + 0.000387933 * T * T - (T * T * T) / 38710000;
  const th = rad(mod(gmst + lon, 360));
  const eps = rad(23.4392911 - 0.0130042 * T);
  const y = Math.cos(th);
  const x = -(Math.sin(th) * Math.cos(eps) + Math.tan(rad(lat)) * Math.sin(eps));
  return mod(deg(Math.atan2(y, x)) - ayanamsa(jd, kind), 360);
}

function sidLon(code, ms, kind = 'lahiri') {
  const jd = ms / 86400000 + 2440587.5;
  const ayan = ayanamsa(jd, kind);

  if (code === 'Ra' || code === 'Ke') {
    const c = (jd - 2451545) / 36525;
    let om = 125.04452 - 1934.136261 * c;
    if (code === 'Ke') om += 180;
    return mod(om - ayan, 360);
  }

  const astro = (typeof Astronomy !== 'undefined') ? Astronomy : ((typeof window !== 'undefined' && window.Astronomy) ? window.Astronomy : (typeof global !== 'undefined' ? global.Astronomy : null));
  if (!astro) throw new Error('Astronomy engine not loaded');

  const t = astro.MakeTime(new Date(ms));
  const rot = astro.Rotation_EQJ_ECT(t);
  const geo = astro.GeoVector(BODY[code], t, true);
  const e = astro.RotateVector(rot, geo);
  return mod(deg(Math.atan2(e.y, e.x)) - ayan, 360);
}

function planets(ms, kind = 'lahiri') {
  return CODES.map(c => {
    const lon = sidLon(c, ms, kind);
    let retro = (c === 'Ra' || c === 'Ke');
    if (!retro && c !== 'Su' && c !== 'Mo') {
      const lonAhead = sidLon(c, ms + 3600000, kind);
      const lonBehind = sidLon(c, ms - 3600000, kind);
      retro = (mod(lonAhead - lonBehind + 180, 360) - 180) < 0;
    }
    return { c, lon, retro };
  });
}

function hqSub(lon) {
  const nak = Math.floor(lon / (360 / 27));
  const rem = lon - nak * (360 / 27);
  const star = _ORDER[nak % 9];
  const N = 360 / 27;

  let pos = 0;
  let sub = star;
  const startIdx = nak % 9;
  for (let j = 0; j < 9; j++) {
    const s = _ORDER[(startIdx + j) % 9];
    const len = (N * YEARS[s]) / 120;
    if (rem >= pos && rem < pos + len) { sub = s; break; }
    pos += len;
  }
  return { nak, star, sub };
}

function obliq(jd) {
  const T = (jd - 2451545) / 36525;
  return 23.4392911 - 0.0130042 * T;
}

function ramcOf(ms, lon) {
  const jd = ms / 86400000 + 2440587.5;
  const d = jd - 2451545;
  const T = d / 36525;
  return mod(280.46061837 + 360.98564736629 * d + 0.000387933 * T * T - (T * T * T) / 38710000 + lon, 360);
}

function placidusCusps(ms, lat, lon, kind = 'lahiri') {
  if (Math.abs(lat) > 62) {
    const asc = sidAsc(ms, lat, lon, kind);
    return Array.from({ length: 12 }, (_, i) => mod(asc + i * 30, 360));
  }
  const jd = ms / 86400000 + 2440587.5;
  const th = ramcOf(ms, lon);
  const e = rad(obliq(jd));
  const phi = rad(lat);
  const decl = ra => Math.atan(Math.tan(e) * Math.sin(rad(ra)));
  const sda = ra => deg(Math.acos(Math.max(-1, Math.min(1, -Math.tan(phi) * Math.tan(decl(ra))))));
  const lam = ra => mod(deg(Math.atan2(Math.sin(rad(ra)), Math.cos(rad(ra)) * Math.cos(e))), 360);
  const up = f => { let ra = th + f * 90; for (let i = 0; i < 40; i++) ra = th + f * sda(ra); return lam(ra); };
  const dn = f => { let ra = th + 180 - (1 - f) * 90; for (let i = 0; i < 40; i++) ra = th + 180 - (1 - f) * (180 - sda(ra)); return lam(ra); };
  const asc = mod(deg(Math.atan2(Math.cos(rad(th)), -(Math.sin(rad(th)) * Math.cos(e) + Math.tan(phi) * Math.sin(e)))), 360);
  const mc = lam(th);
  const c11 = up(1/3);
  const c12 = up(2/3);
  const c2 = dn(1/3);
  const c3 = dn(2/3);
  const a = ayanamsa(jd, kind);
  return [asc, c2, c3, mc + 180, c11 + 180, c12 + 180, asc + 180, c2 + 180, c3 + 180, mc, c11, c12].map(x => mod(x - a, 360));
}

function p2(n) { return String(n).padStart(2, '0'); }

function fmtDeg(lon) {
  const inSign = mod(lon, 30);
  const d = Math.floor(inSign);
  const m = Math.floor((inSign - d) * 60);
  return `${d}°${p2(m)}′`;
}

function vimshottariDasha(moonLon, birthMs) {
  const nakLen = 360 / 27; // 13°20' = 13.3333°
  const nakIdx = Math.floor(moonLon / nakLen);
  const nakRem = moonLon - nakIdx * nakLen;
  const lordIdx = nakIdx % 9;
  const firstLord = _ORDER[lordIdx];
  const totalYears = YEARS[firstLord];
  const balanceYears = totalYears * (1 - nakRem / nakLen);

  const MS_PER_YEAR = 365.25 * 86400000;
  const dashaTree = [];
  let t = birthMs;

  for (let i = 0; i < 9; i++) {
    const planet = _ORDER[(lordIdx + i) % 9];
    const durYears = (i === 0) ? balanceYears : YEARS[planet];
    const durMs = durYears * MS_PER_YEAR;
    const startMs = t;
    const endMs = t + durMs;

    const bhuktis = [];
    const pStartIdx = _ORDER.indexOf(planet);
    let bt = startMs;
    for (let j = 0; j < 9; j++) {
      const bPlanet = _ORDER[(pStartIdx + j) % 9];
      const bYears = (YEARS[planet] * YEARS[bPlanet]) / 120;
      const bDurMs = (durYears / YEARS[planet]) * bYears * MS_PER_YEAR;
      bhuktis.push({
        planet,
        sub: bPlanet,
        sub_name: NAME[bPlanet],
        start: new Date(bt).toISOString().slice(0, 10),
        end: new Date(bt + bDurMs).toISOString().slice(0, 10),
        startMs: bt,
        endMs: bt + bDurMs
      });
      bt += bDurMs;
    }

    dashaTree.push({
      planet,
      name: NAME[planet],
      years: durYears,
      start: new Date(startMs).toISOString().slice(0, 10),
      end: new Date(endMs).toISOString().slice(0, 10),
      startMs,
      endMs,
      bhuktis
    });

    t = endMs;
  }

  const now = Date.now();
  let currentDasha = dashaTree[0];
  for (const d of dashaTree) {
    if (now >= d.startMs && now < d.endMs) { currentDasha = d; break; }
  }

  let currentBhukti = currentDasha.bhuktis[0];
  for (const b of currentDasha.bhuktis) {
    if (now >= b.startMs && now < b.endMs) { currentBhukti = b; break; }
  }

  return {
    all_dashas: dashaTree,
    current: {
      planet: currentDasha.planet,
      name: currentDasha.name,
      start: currentDasha.start,
      end: currentDasha.end,
      bhukti: currentBhukti
    },
    bhuktis: currentDasha.bhuktis
  };
}

function computeChart({ name, dob, tob, lat, lon, tzOffset = 5.5, ayanamsaKind = 'lahiri' }) {
  if (!dob || !tob || lat == null || lon == null) {
    throw new Error('dob, tob, lat, and lon are required');
  }

  let y, m, d;
  if (dob.includes('-')) {
    [y, m, d] = dob.split('-').map(Number);
  } else if (dob.includes('/')) {
    [d, m, y] = dob.split('/').map(Number);
  }

  const [hh, mm] = tob.split(':').map(Number);
  const birthMs = Date.UTC(y, m - 1, d, hh, mm) - tzOffset * 3600000;
  const jd = birthMs / 86400000 + 2440587.5;
  const kind = ayanamsaKind;
  const ayan = ayanamsa(jd, kind);

  const ascLon = sidAsc(birthMs, lat, lon, kind);
  const ascSignNo = Math.floor(ascLon / 30) % 12;
  const ascNakNo = Math.floor(ascLon / (360 / 27));
  const ascPada = Math.floor((ascLon % (360 / 27)) / (360 / 108)) + 1;
  const ascSub = hqSub(ascLon);

  const lagna = {
    sign: SIGNS[ascSignNo][0],
    sign_no: ascSignNo,
    tamil_sign: TLAG[ascSignNo],
    degree: fmtDeg(ascLon),
    longitude: ascLon,
    lord: SIGNS[ascSignNo][1],
    lord_name: NAME[SIGNS[ascSignNo][1]],
    nakshatra: NAKS[ascNakNo],
    nak_no: ascNakNo,
    star_lord: ascSub.star,
    sub_lord: ascSub.sub,
    pada: ascPada
  };

  const plList = planets(birthMs, kind);
  const moPl = plList.find(p => p.c === 'Mo');
  const moonLon = moPl ? moPl.lon : 0;
  const moonSignNo = Math.floor(moonLon / 30) % 12;
  const moonNakNo = Math.floor(moonLon / (360 / 27));
  const moonPada = Math.floor((moonLon % (360 / 27)) / (360 / 108)) + 1;
  const moonSub = hqSub(moonLon);

  const rasi = {
    sign: SIGNS[moonSignNo][0],
    sign_no: moonSignNo,
    tamil_sign: TLAG[moonSignNo],
    degree: fmtDeg(moonLon),
    longitude: moonLon,
    lord: SIGNS[moonSignNo][1],
    lord_name: NAME[SIGNS[moonSignNo][1]],
    nakshatra: NAKS[moonNakNo],
    nak_no: moonNakNo,
    star_lord: moonSub.star,
    sub_lord: moonSub.sub,
    pada: moonPada
  };

  const cuspDegs = placidusCusps(birthMs, lat, lon, kind);

  function getHouse(lonVal) {
    const A = ascSignNo;
    const plSign = Math.floor(lonVal / 30) % 12;
    return ((plSign - A + 12) % 12) + 1;
  }

  const planetRows = plList.map(p => {
    const signNo = Math.floor(p.lon / 30) % 12;
    const nakNo = Math.floor(p.lon / (360 / 27));
    const pada = Math.floor((p.lon % (360 / 27)) / (360 / 108)) + 1;
    const sub = hqSub(p.lon);
    const house = getHouse(p.lon);

    return {
      code: p.c,
      name: NAME[p.c],
      sign: SIGNS[signNo][0],
      sign_no: signNo,
      degree: fmtDeg(p.lon),
      longitude: p.lon,
      house,
      sign_lord: SIGNS[signNo][1],
      nakshatra: NAKS[nakNo],
      nak_no: nakNo,
      pada,
      star_lord: sub.star,
      sub_lord: sub.sub,
      retro: p.retro
    };
  });

  const dasha = vimshottariDasha(moonLon, birthMs);

  return {
    name: name || 'Native',
    dob,
    tob,
    lat,
    lon,
    tz_offset: tzOffset,
    ayanamsa_kind: kind,
    ayanamsa: ayan,
    lagna,
    rasi,
    planets: planetRows,
    cusps: cuspDegs,
    dasha: {
      current: {
        planet: dasha.current.planet,
        name: dasha.current.name,
        start: dasha.current.start,
        end: dasha.current.end,
        bhukti: dasha.current.bhukti
      },
      bhuktis: dasha.bhuktis,
      all_dashas: dasha.all_dashas
    }
  };
}

if (typeof window !== 'undefined') {
  window.computeChart = computeChart;
  window.findSeg = findSeg;
  window.ayanamsa = ayanamsa;
  window.sidAsc = sidAsc;
  window.sidLon = sidLon;
  window.planets = planets;
  window.placidusCusps = placidusCusps;
  window.vimshottariDasha = vimshottariDasha;
  window.ORDER = ORDER;
  window.NAME = NAME;
  window.SIGNS = SIGNS;
  window.NAKS = NAKS;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    computeChart, findSeg, ayanamsa, sidAsc, sidLon,
    planets, placidusCusps, vimshottariDasha, ORDER, NAME, SIGNS, NAKS
  };
}
