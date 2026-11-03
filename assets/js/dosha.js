/**
 * dosha.js â€“ KP / Vedic Dosha & Yoga Analysis Engine (ES Module)
 *
 * Usage:
 *   import { analyseDosha } from './dosha.js';
 *   const doshaReport = analyseDosha(chartData);
 *
 * @param {Object} chartData  Output of computeChart() from chart.js
 */

'use strict';

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

/**
 * Returns the house number of a given planet code.
 * @param {Object[]} planets
 * @param {string}   code
 */
function houseOf(planets, code) {
  const p = planets.find(p => p.code === code);
  return p ? p.house : null;
}

/**
 * Returns the sign number (0â€“11) of a given planet code.
 */
function signOf(planets, code) {
  const p = planets.find(p => p.code === code);
  return p ? p.sign_no : null;
}

/**
 * Returns sign lord of a given house cusp.
 * @param {number[]} cusps  Array of 12 cusp longitudes (degrees)
 * @param {number}   house  1-based house number
 */
function cuspSignLord(cusps, house) {
  const SIGN_LORDS = [
    'Ma', 'Ve', 'Me', 'Mo', 'Su', 'Me',
    'Ve', 'Ma', 'Ju', 'Sa', 'Sa', 'Ju'
  ];
  const lon = cusps[house - 1];
  return SIGN_LORDS[Math.floor(lon / 30) % 12];
}

/**
 * Are two planets conjunct (within Â±10Â°)?
 */
function conjunct(pl, a, b) {
  const pa = pl.find(p => p.code === a);
  const pb = pl.find(p => p.code === b);
  if (!pa || !pb) return false;
  const diff = Math.abs(pa.lon_abs - pb.lon_abs) % 360;
  return Math.min(diff, 360 - diff) < 10;
}

/**
 * Is planet A in a kendra (1,4,7,10) from planet B?
 */
function inKendraFrom(pl, planetA, planetB) {
  const ha = houseOf(pl, planetA);
  const hb = houseOf(pl, planetB);
  if (!ha || !hb) return false;
  const diff = ((ha - hb + 12) % 12) + 1; // 1-based relative house
  return [1, 4, 7, 10].includes(diff);
}

/**
 * Is planet A in a trikona (1,5,9) from planet B?
 */
function inTrikonaFrom(pl, planetA, planetB) {
  const ha = houseOf(pl, planetA);
  const hb = houseOf(pl, planetB);
  if (!ha || !hb) return false;
  const diff = ((ha - hb + 12) % 12) + 1;
  return [1, 5, 9].includes(diff);
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ DOSHA CHECKS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

/**
 * Sevvai / Mangal Dosha check.
 *
 * Mars in houses 1, 2, 4, 7, 8, or 12 from:
 *   - Lagna (ascendant) sign
 *   - Moon sign (rasi)
 *   - Venus sign
 *
 * Cancellations are noted but not applied (traditional strict check).
 */
function checkSevvaiDosha(chartData) {
  const { planets: pl, lagna, rasi } = chartData;
  const DOSHA_HOUSES = [1, 2, 4, 7, 8, 12];

  const marsHouse = houseOf(pl, 'Ma');
  const marsSignNo = signOf(pl, 'Ma');
  const venusSignNo = signOf(pl, 'Ve');

  if (marsHouse === null) {
    return { present: false, reason: 'Mars position unavailable.', remedy: '' };
  }

  const triggered = [];

  // From Lagna
  if (DOSHA_HOUSES.includes(marsHouse)) {
    triggered.push(`Mars in house ${marsHouse} from Lagna`);
  }

  // From Moon (Rasi): compute Mars's house relative to Moon's sign
  const moonSignNo = rasi.sign_no;
  if (marsSignNo !== null) {
    const houseFromMoon = ((marsSignNo - moonSignNo + 12) % 12) + 1;
    if (DOSHA_HOUSES.includes(houseFromMoon)) {
      triggered.push(`Mars in house ${houseFromMoon} from Moon (Rasi)`);
    }

    // From Venus
    if (venusSignNo !== null) {
      const houseFromVenus = ((marsSignNo - venusSignNo + 12) % 12) + 1;
      if (DOSHA_HOUSES.includes(houseFromVenus)) {
        triggered.push(`Mars in house ${houseFromVenus} from Venus`);
      }
    }
  }

  const present = triggered.length > 0;

  // Partial cancellation checks (informational)
  const cancellations = [];
  // Mars in own sign / exaltation (Aries=0, Scorpio=7, Capricorn=9)
  if ([0, 7].includes(marsSignNo)) cancellations.push('Mars in own sign (partial cancellation)');
  if (marsSignNo === 9) cancellations.push('Mars exalted in Capricorn (partial cancellation)');
  // Both partners have Mangal Dosha â€“ typically cancels each other (traditional)

  const remedy = present
    ? [
        'Perform Kuja Dosha Niwaran puja on Tuesdays.',
        'Recite Mangala Ashtakam or Hanuman Chalisa daily.',
        'Donate red lentils (masoor dal) and jaggery on Tuesdays.',
        'Wear a red coral (moonga) in gold ring on the ring finger of the right hand after consulting a qualified astrologer.',
        cancellations.length ? `Note: ${cancellations.join('; ')}.` : ''
      ].filter(Boolean).join(' ')
    : '';

  return {
    present,
    reason: present ? triggered.join('; ') : 'Mars does not occupy a Mangal Dosha house.',
    cancellations,
    remedy
  };
}

/**
 * Kala Sarpa Dosha check.
 *
 * All 7 classic planets (Su, Mo, Ma, Ju, Sa, Me, Ve) must lie
 * strictly between Rahu and Ketu in the same arc direction (Rahuâ†’Ketu clockwise).
 *
 * Type is named by the house Rahu occupies.
 */
function checkKalaSarpa(chartData) {
  const { planets: pl } = chartData;

  const KALA_SARPA_TYPES = [
    'Anant', 'Kulik', 'Vasuki', 'Shankhpal', 'Padma', 'Mahapadma',
    'Takshak', 'Karkotak', 'Shankhachur', 'Ghatok', 'Vishdhar', 'Sheshnag'
  ];

  const rahuHouse = houseOf(pl, 'Ra');
  const rahuLon = pl.find(p => p.code === 'Ra')?.lon_abs;
  const ketuLon = pl.find(p => p.code === 'Ke')?.lon_abs;

  if (rahuLon === undefined || ketuLon === undefined) {
    return { present: false, type: null, reason: 'Rahu/Ketu positions unavailable.' };
  }

  const CLASSIC = ['Su', 'Mo', 'Ma', 'Ju', 'Sa', 'Me', 'Ve'];
  const mod360 = x => ((x % 360) + 360) % 360;

  // Arc from Rahu to Ketu going counter-clockwise (Rahuâ†’Ketu direction)
  // Kala Sarpa: all planets in the arc from Ra to Ke (going counter-clockwise / decreasing longitude)
  const arcLen = mod360(rahuLon - ketuLon); // arc Raâ†’Ke counter-clockwise

  let allInArc = true;
  for (const code of CLASSIC) {
    const p = pl.find(p => p.code === code);
    if (!p) { allInArc = false; break; }
    const distFromRahu = mod360(rahuLon - p.lon_abs);
    // Planet must be between Rahu and Ketu (counter-clockwise arc from Ra)
    if (distFromRahu <= 0 || distFromRahu >= arcLen) {
      allInArc = false;
      break;
    }
  }

  // Check opposite direction (Ketuâ†’Rahu arc, called Partial or Kalasarpa variations)
  let allInOppositeArc = !allInArc;
  if (allInOppositeArc) {
    const arcLen2 = mod360(ketuLon - rahuLon);
    for (const code of CLASSIC) {
      const p = pl.find(p => p.code === code);
      if (!p) { allInOppositeArc = false; break; }
      const distFromKetu = mod360(ketuLon - p.lon_abs);
      if (distFromKetu <= 0 || distFromKetu >= arcLen2) {
        allInOppositeArc = false;
        break;
      }
    }
  }

  const present = allInArc || allInOppositeArc;
  const type = present ? (KALA_SARPA_TYPES[(rahuHouse - 1) % 12] || 'Unknown') : null;

  return {
    present,
    type,
    rahu_house: rahuHouse,
    direction: allInArc ? 'Rahuâ†’Ketu (standard)' : allInOppositeArc ? 'Ketuâ†’Rahu (reverse)' : null,
    reason: present
      ? `All 7 planets lie between Rahu (house ${rahuHouse}) and Ketu. Type: ${type} Kala Sarpa.`
      : 'Planets are not fully enclosed between Rahu and Ketu.'
  };
}

/**
 * Gajakesari Yoga check.
 *
 * Jupiter must be in a kendra (1, 4, 7, 10) from the Moon.
 * Also checks if Jupiter is in a kendra from Lagna.
 */
function checkGajakesari(chartData) {
  const { planets: pl } = chartData;

  const jupFromMoon = inKendraFrom(pl, 'Ju', 'Mo');
  const jupFromLagna = [1, 4, 7, 10].includes(houseOf(pl, 'Ju'));

  const present = jupFromMoon;
  let description = '';

  if (jupFromMoon && jupFromLagna) {
    description = 'Jupiter is in a kendra from both the Moon and the Lagna â€” a strong Gajakesari Yoga.';
  } else if (jupFromMoon) {
    description = 'Jupiter is in a kendra from the Moon â€” classic Gajakesari Yoga.';
  } else if (jupFromLagna) {
    description = 'Jupiter is in a kendra from the Lagna (partial Gajakesari effect, not classical).';
  } else {
    description = 'Jupiter is not in a kendra from the Moon. Gajakesari Yoga is absent.';
  }

  return { present, description };
}

/**
 * Raja Yoga check.
 *
 * Combinations: lords of houses 1+5, 1+9, 4+5, 5+9, 5+10, 9+10
 * are conjunct OR in mutual kendra / trikona.
 */
function checkRajaYoga(chartData) {
  const { planets: pl, cusps } = chartData;
  const COMBOS = [
    [1, 5], [1, 9], [4, 5], [5, 9], [5, 10], [9, 10]
  ];

  const yogas = [];

  for (const [h1, h2] of COMBOS) {
    const lord1 = cuspSignLord(cusps, h1);
    const lord2 = cuspSignLord(cusps, h2);
    if (!lord1 || !lord2) continue;

    if (lord1 === lord2) {
      // Same planet rules both houses
      yogas.push({
        name: `${h1}thâ€“${h2}th Lord Raja Yoga`,
        description: `${lord1} (${h1}th and ${h2}th lord) is a powerful single planet forming Raja Yoga.`,
        lords: [lord1]
      });
      continue;
    }

    const isConjunct = conjunct(pl, lord1, lord2);
    const isKendra = inKendraFrom(pl, lord1, lord2) || inKendraFrom(pl, lord2, lord1);
    const isTrikona = inTrikonaFrom(pl, lord1, lord2) || inTrikonaFrom(pl, lord2, lord1);

    if (isConjunct) {
      yogas.push({
        name: `${h1}thâ€“${h2}th Lord Conjunction Raja Yoga`,
        description: `Lords of ${h1}th (${lord1}) and ${h2}th (${lord2}) are conjunct â€” Raja Yoga.`,
        lords: [lord1, lord2]
      });
    } else if (isKendra) {
      yogas.push({
        name: `${h1}thâ€“${h2}th Lord Kendra Mutual Raja Yoga`,
        description: `Lords of ${h1}th (${lord1}) and ${h2}th (${lord2}) are in mutual kendra â€” Raja Yoga.`,
        lords: [lord1, lord2]
      });
    } else if (isTrikona) {
      yogas.push({
        name: `${h1}thâ€“${h2}th Lord Trikona Mutual Yoga`,
        description: `Lords of ${h1}th (${lord1}) and ${h2}th (${lord2}) are in mutual trikona â€” Dhana/Raja Yoga.`,
        lords: [lord1, lord2]
      });
    }
  }

  return yogas;
}

/**
 * Naga Dosha check.
 *
 * Rahu in lagna (1st house) or 7th house.
 */
function checkNagaDosha(chartData) {
  const { planets: pl } = chartData;
  const rahuHouse = houseOf(pl, 'Ra');
  const present = rahuHouse === 1 || rahuHouse === 7;
  return {
    present,
    house: rahuHouse,
    reason: present
      ? `Rahu in ${rahuHouse === 1 ? 'Lagna (1st house)' : '7th house'} causes Naga Dosha.`
      : 'Rahu is not in the 1st or 7th house. Naga Dosha is absent.',
    remedy: present
      ? 'Perform Naga Puja / Sarpa Dosha Nivarana on Naga Panchami. Offer milk at snake temples (e.g., Kukke Subramanya). Chant Sarpa Sukta.' : ''
  };
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ MAIN EXPORT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

/**
 * Analyses all major doshas and yogas from computed chart data.
 *
 * @param {Object} chartData  Result of computeChart() from chart.js
 * @returns {Object}  Dosha / yoga report
 */
function analyseDosha(chartData) {
  return {
    sevvai_dosha: checkSevvaiDosha(chartData),
    kala_sarpa: checkKalaSarpa(chartData),
    gajakesari: checkGajakesari(chartData),
    raja_yogam: checkRajaYoga(chartData),
    naga_dosha: checkNagaDosha(chartData)
  };
}

if (typeof window !== 'undefined') {
  window.analyseDosha = analyseDosha;
  window.analyzeDoshas = analyseDosha;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { analyseDosha, analyzeDoshas: analyseDosha };
}
