/**
 * charts.test.js — Validation Suite for 10-20 Hand-Calculated Charts
 * Compares output of assets/js/chart.js against verified charts.
 */

const TEST_SUITE = [
  {
    name: "Chart 1: Chennai Native (1990)",
    dob: "1990-05-14",
    tob: "08:30",
    pob: "Chennai",
    lat: 13.0827,
    lon: 80.2707,
    tzOffset: 5.5,
    expected: {
      lagna_sign: "Gemini",
      rasi_sign: "Sagittarius",
      nakshatra: "Mula"
    }
  },
  {
    name: "Chart 2: Madurai Native (1985)",
    dob: "1985-11-20",
    tob: "18:45",
    pob: "Madurai",
    lat: 9.9252,
    lon: 78.1198,
    tzOffset: 5.5,
    expected: {
      lagna_sign: "Taurus",
      rasi_sign: "Aquarius",
      nakshatra: "Shatabhisha"
    }
  },
  {
    name: "Chart 3: Coimbatore Native (1995)",
    dob: "1995-03-08",
    tob: "06:15",
    pob: "Coimbatore",
    lat: 11.0168,
    lon: 76.9558,
    tzOffset: 5.5,
    expected: {
      lagna_sign: "Aquarius",
      rasi_sign: "Taurus",
      nakshatra: "Rohini"
    }
  },
  {
    name: "Chart 4: Trichy Native (2000)",
    dob: "2000-01-01",
    tob: "12:00",
    pob: "Tiruchirappalli",
    lat: 10.7905,
    lon: 78.7047,
    tzOffset: 5.5,
    expected: {
      lagna_sign: "Pisces",
      rasi_sign: "Libra",
      nakshatra: "Swati"
    }
  },
  {
    name: "Chart 5: Salem Native (1992)",
    dob: "1992-08-15",
    tob: "10:10",
    pob: "Salem",
    lat: 11.6643,
    lon: 78.1460,
    tzOffset: 5.5,
    expected: {
      lagna_sign: "Virgo",
      rasi_sign: "Aquarius",
      nakshatra: "Shatabhisha"
    }
  },
  {
    name: "Chart 6: Bengaluru Native (1988)",
    dob: "1988-12-05",
    tob: "22:30",
    pob: "Bengaluru",
    lat: 12.9716,
    lon: 77.5946,
    tzOffset: 5.5,
    expected: {
      lagna_sign: "Leo",
      rasi_sign: "Libra",
      nakshatra: "Chitra"
    }
  },
  {
    name: "Chart 7: Mumbai Native (1993)",
    dob: "1993-04-14",
    tob: "15:20",
    pob: "Mumbai",
    lat: 19.0760,
    lon: 72.8777,
    tzOffset: 5.5,
    expected: {
      lagna_sign: "Leo",
      rasi_sign: "Sagittarius",
      nakshatra: "Purva Ashadha"
    }
  },
  {
    name: "Chart 8: Delhi Native (1998)",
    dob: "1998-10-24",
    tob: "04:45",
    pob: "Delhi",
    lat: 28.6139,
    lon: 77.2090,
    tzOffset: 5.5,
    expected: {
      lagna_sign: "Virgo",
      rasi_sign: "Scorpio",
      nakshatra: "Jyeshtha"
    }
  },
  {
    name: "Chart 9: Kolkata Native (1982)",
    dob: "1982-07-28",
    tob: "20:05",
    pob: "Kolkata",
    lat: 22.5726,
    lon: 88.3639,
    tzOffset: 5.5,
    expected: {
      lagna_sign: "Aquarius",
      rasi_sign: "Libra",
      nakshatra: "Vishakha"
    }
  },
  {
    name: "Chart 10: Singapore Native (2001)",
    dob: "2001-09-11",
    tob: "09:00",
    pob: "Singapore",
    lat: 1.3521,
    lon: 103.8198,
    tzOffset: 8.0,
    expected: {
      lagna_sign: "Libra",
      rasi_sign: "Gemini",
      nakshatra: "Ardra"
    }
  },
  {
    name: "Chart 11: London Native (1991)",
    dob: "1991-06-21",
    tob: "13:30",
    pob: "London",
    lat: 51.5074,
    lon: -0.1278,
    tzOffset: 1.0,
    expected: {
      lagna_sign: "Virgo",
      rasi_sign: "Virgo",
      nakshatra: "Hasta"
    }
  },
  {
    name: "Chart 12: Dubai Native (1996)",
    dob: "1996-12-31",
    tob: "23:55",
    pob: "Dubai",
    lat: 25.2048,
    lon: 55.2708,
    tzOffset: 4.0,
    expected: {
      lagna_sign: "Virgo",
      rasi_sign: "Virgo",
      nakshatra: "Uttara Phalguni"
    }
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TEST_SUITE;
}

