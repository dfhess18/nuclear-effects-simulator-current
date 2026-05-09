/**
 * Top 20 US cities by population (2023 Census estimates), with the FIPS
 * codes of every county whose territory the city sits in plus a "1 ring"
 * of immediate neighbors. This scope is what `scripts/fetch-census.mjs`
 * uses to download block-group population/geometry per city, and what
 * the runtime population model covers.
 *
 * Defaults pin ground zero on a recognizable downtown landmark so the
 * dropdown produces a meaningful starting view.
 *
 * FIPS reference: 2-digit state + 3-digit county.
 *   https://www.census.gov/library/reference/code-lists/ansi.html
 */

export interface CityCounty {
  /** 2-digit state FIPS, e.g. '36' for NY. */
  state: string;
  /** 3-digit county FIPS, e.g. '005' for Bronx. */
  county: string;
  /** Free-form note for debugging/maintenance. */
  note?: string;
}

export interface CityEntry {
  id: string;
  /** "Boston, MA" — used in dropdown labels. */
  name: string;
  state: string;
  defaultCenter: { lat: number; lng: number };
  defaultGroundZero: { lat: number; lng: number };
  /** [[south, west], [north, east]] — loose bounding box for fly-to framing. */
  bounds: [[number, number], [number, number]];
  /** State+county FIPS pairs to fetch Census data for. */
  counties: CityCounty[];
}

export const CITIES: CityEntry[] = [
  {
    id: "nyc",
    name: "New York, NY",
    state: "NY",
    defaultCenter: { lat: 40.7580, lng: -73.9855 },
    defaultGroundZero: { lat: 40.7580, lng: -73.9855 }, // Times Square
    bounds: [[40.49, -74.27], [40.92, -73.69]],
    counties: [
      { state: "36", county: "005", note: "Bronx" },
      { state: "36", county: "047", note: "Kings (Brooklyn)" },
      { state: "36", county: "061", note: "New York (Manhattan)" },
      { state: "36", county: "081", note: "Queens" },
      { state: "36", county: "085", note: "Richmond (Staten Island)" },
      { state: "36", county: "059", note: "Nassau (Long Island, neighbor)" },
      { state: "36", county: "119", note: "Westchester (neighbor)" },
      { state: "34", county: "017", note: "Hudson NJ (neighbor)" },
      { state: "34", county: "003", note: "Bergen NJ (neighbor)" },
    ],
  },
  {
    id: "los-angeles",
    name: "Los Angeles, CA",
    state: "CA",
    defaultCenter: { lat: 34.0479, lng: -118.2510 },
    defaultGroundZero: { lat: 34.0479, lng: -118.2510 }, // Pershing Square / DTLA
    bounds: [[33.70, -118.67], [34.34, -117.65]],
    counties: [
      { state: "06", county: "037", note: "Los Angeles" },
      { state: "06", county: "059", note: "Orange (neighbor)" },
    ],
  },
  {
    id: "chicago",
    name: "Chicago, IL",
    state: "IL",
    defaultCenter: { lat: 41.8789, lng: -87.6359 },
    defaultGroundZero: { lat: 41.8789, lng: -87.6359 }, // Willis Tower / Loop
    bounds: [[41.64, -87.94], [42.02, -87.52]],
    counties: [
      { state: "17", county: "031", note: "Cook" },
      { state: "17", county: "043", note: "DuPage (neighbor)" },
      { state: "17", county: "097", note: "Lake (neighbor)" },
    ],
  },
  {
    id: "houston",
    name: "Houston, TX",
    state: "TX",
    defaultCenter: { lat: 29.7604, lng: -95.3698 },
    defaultGroundZero: { lat: 29.7604, lng: -95.3698 }, // Downtown / City Hall
    bounds: [[29.52, -95.79], [30.11, -95.01]],
    counties: [
      { state: "48", county: "201", note: "Harris" },
      { state: "48", county: "157", note: "Fort Bend (neighbor)" },
      { state: "48", county: "339", note: "Montgomery TX (neighbor)" },
    ],
  },
  {
    id: "phoenix",
    name: "Phoenix, AZ",
    state: "AZ",
    defaultCenter: { lat: 33.4484, lng: -112.0740 },
    defaultGroundZero: { lat: 33.4484, lng: -112.0740 }, // Downtown
    bounds: [[33.27, -112.32], [33.73, -111.89]],
    counties: [
      // Maricopa is enormous and covers Phoenix + every suburb.
      { state: "04", county: "013", note: "Maricopa" },
    ],
  },
  {
    id: "philadelphia",
    name: "Philadelphia, PA",
    state: "PA",
    defaultCenter: { lat: 39.9526, lng: -75.1652 },
    defaultGroundZero: { lat: 39.9526, lng: -75.1652 }, // City Hall
    bounds: [[39.86, -75.28], [40.14, -74.96]],
    counties: [
      { state: "42", county: "101", note: "Philadelphia" },
      { state: "42", county: "091", note: "Montgomery PA (neighbor)" },
      { state: "42", county: "045", note: "Delaware PA (neighbor)" },
      { state: "42", county: "017", note: "Bucks (neighbor)" },
      { state: "34", county: "007", note: "Camden NJ (neighbor)" },
    ],
  },
  {
    id: "san-antonio",
    name: "San Antonio, TX",
    state: "TX",
    defaultCenter: { lat: 29.4260, lng: -98.4861 },
    defaultGroundZero: { lat: 29.4260, lng: -98.4861 }, // The Alamo
    bounds: [[29.18, -98.81], [29.72, -98.21]],
    counties: [
      { state: "48", county: "029", note: "Bexar" },
    ],
  },
  {
    id: "san-diego",
    name: "San Diego, CA",
    state: "CA",
    defaultCenter: { lat: 32.7157, lng: -117.1611 },
    defaultGroundZero: { lat: 32.7157, lng: -117.1611 }, // Downtown
    bounds: [[32.55, -117.32], [33.11, -116.85]],
    counties: [
      { state: "06", county: "073", note: "San Diego" },
    ],
  },
  {
    id: "dallas",
    name: "Dallas, TX",
    state: "TX",
    defaultCenter: { lat: 32.7767, lng: -96.7970 },
    defaultGroundZero: { lat: 32.7767, lng: -96.7970 }, // Downtown / Dealey Plaza
    bounds: [[32.62, -97.04], [33.02, -96.55]],
    counties: [
      { state: "48", county: "113", note: "Dallas" },
      { state: "48", county: "439", note: "Tarrant (neighbor)" },
      { state: "48", county: "085", note: "Collin (neighbor)" },
      { state: "48", county: "121", note: "Denton (neighbor)" },
    ],
  },
  {
    id: "jacksonville",
    name: "Jacksonville, FL",
    state: "FL",
    defaultCenter: { lat: 30.3322, lng: -81.6557 },
    defaultGroundZero: { lat: 30.3322, lng: -81.6557 }, // Downtown
    bounds: [[30.10, -81.91], [30.59, -81.38]],
    counties: [
      // Jacksonville is consolidated with Duval County.
      { state: "12", county: "031", note: "Duval" },
      { state: "12", county: "089", note: "Nassau FL (neighbor)" },
      { state: "12", county: "109", note: "St. Johns (neighbor)" },
      { state: "12", county: "019", note: "Clay (neighbor)" },
    ],
  },
  {
    id: "austin",
    name: "Austin, TX",
    state: "TX",
    defaultCenter: { lat: 30.2747, lng: -97.7404 },
    defaultGroundZero: { lat: 30.2747, lng: -97.7404 }, // State Capitol
    bounds: [[30.10, -97.94], [30.55, -97.55]],
    counties: [
      { state: "48", county: "453", note: "Travis" },
      { state: "48", county: "491", note: "Williamson (neighbor)" },
      { state: "48", county: "209", note: "Hays (neighbor)" },
    ],
  },
  {
    id: "fort-worth",
    name: "Fort Worth, TX",
    state: "TX",
    defaultCenter: { lat: 32.7555, lng: -97.3308 },
    defaultGroundZero: { lat: 32.7555, lng: -97.3308 }, // Downtown
    bounds: [[32.55, -97.55], [33.00, -97.07]],
    counties: [
      { state: "48", county: "439", note: "Tarrant" },
      { state: "48", county: "121", note: "Denton (neighbor)" },
      { state: "48", county: "367", note: "Parker (neighbor)" },
    ],
  },
  {
    id: "san-jose",
    name: "San Jose, CA",
    state: "CA",
    defaultCenter: { lat: 37.3382, lng: -121.8863 },
    defaultGroundZero: { lat: 37.3382, lng: -121.8863 }, // Downtown
    bounds: [[37.18, -122.07], [37.49, -121.66]],
    counties: [
      { state: "06", county: "085", note: "Santa Clara" },
      { state: "06", county: "001", note: "Alameda (neighbor)" },
    ],
  },
  {
    id: "charlotte",
    name: "Charlotte, NC",
    state: "NC",
    defaultCenter: { lat: 35.2271, lng: -80.8431 },
    defaultGroundZero: { lat: 35.2271, lng: -80.8431 }, // Uptown
    bounds: [[35.05, -81.05], [35.45, -80.55]],
    counties: [
      { state: "37", county: "119", note: "Mecklenburg" },
      { state: "37", county: "025", note: "Cabarrus (neighbor)" },
      { state: "37", county: "179", note: "Union (neighbor)" },
    ],
  },
  {
    id: "columbus",
    name: "Columbus, OH",
    state: "OH",
    defaultCenter: { lat: 39.9612, lng: -82.9988 },
    defaultGroundZero: { lat: 39.9612, lng: -82.9988 }, // Downtown
    bounds: [[39.81, -83.21], [40.16, -82.78]],
    counties: [
      { state: "39", county: "049", note: "Franklin" },
      { state: "39", county: "041", note: "Delaware OH (neighbor)" },
    ],
  },
  {
    id: "indianapolis",
    name: "Indianapolis, IN",
    state: "IN",
    defaultCenter: { lat: 39.7684, lng: -86.1581 },
    defaultGroundZero: { lat: 39.7684, lng: -86.1581 }, // Monument Circle
    bounds: [[39.61, -86.39], [40.00, -85.92]],
    counties: [
      { state: "18", county: "097", note: "Marion" },
      { state: "18", county: "057", note: "Hamilton IN (neighbor)" },
    ],
  },
  {
    id: "san-francisco",
    name: "San Francisco, CA",
    state: "CA",
    defaultCenter: { lat: 37.7879, lng: -122.4075 },
    defaultGroundZero: { lat: 37.7879, lng: -122.4075 }, // Union Square
    bounds: [[37.65, -122.55], [37.92, -122.27]],
    counties: [
      { state: "06", county: "075", note: "San Francisco" },
      { state: "06", county: "081", note: "San Mateo (neighbor)" },
      { state: "06", county: "041", note: "Marin (neighbor)" },
      { state: "06", county: "001", note: "Alameda (neighbor)" },
    ],
  },
  {
    id: "seattle",
    name: "Seattle, WA",
    state: "WA",
    defaultCenter: { lat: 47.6062, lng: -122.3321 },
    defaultGroundZero: { lat: 47.6062, lng: -122.3321 }, // Downtown
    bounds: [[47.42, -122.55], [47.78, -122.10]],
    counties: [
      { state: "53", county: "033", note: "King" },
      { state: "53", county: "061", note: "Snohomish (neighbor)" },
    ],
  },
  {
    id: "denver",
    name: "Denver, CO",
    state: "CO",
    defaultCenter: { lat: 39.7392, lng: -104.9903 },
    defaultGroundZero: { lat: 39.7392, lng: -104.9903 }, // Downtown
    bounds: [[39.55, -105.21], [39.94, -104.71]],
    counties: [
      { state: "08", county: "031", note: "Denver" },
      { state: "08", county: "059", note: "Jefferson (neighbor)" },
      { state: "08", county: "005", note: "Arapahoe (neighbor)" },
      { state: "08", county: "001", note: "Adams (neighbor)" },
    ],
  },
  {
    id: "washington-dc",
    name: "Washington, DC",
    state: "DC",
    defaultCenter: { lat: 38.8977, lng: -77.0365 },
    defaultGroundZero: { lat: 38.8977, lng: -77.0365 }, // White House / National Mall
    bounds: [[38.79, -77.20], [39.00, -76.91]],
    counties: [
      { state: "11", county: "001", note: "District of Columbia" },
      { state: "51", county: "013", note: "Arlington VA (neighbor)" },
      { state: "51", county: "510", note: "Alexandria VA (neighbor)" },
      { state: "51", county: "059", note: "Fairfax County VA (neighbor)" },
      { state: "24", county: "031", note: "Montgomery MD (neighbor)" },
      { state: "24", county: "033", note: "Prince George's MD (neighbor)" },
    ],
  },
  // Boston comes last only because we already have data for it; the order
  // isn't significant. Top 20 + Boston = 21 to keep the existing focus city.
  {
    id: "boston",
    name: "Boston, MA",
    state: "MA",
    defaultCenter: { lat: 42.3554, lng: -71.0603 },
    defaultGroundZero: { lat: 42.3554, lng: -71.0603 }, // Downtown Crossing
    bounds: [[42.2279, -71.1912], [42.397, -70.9232]],
    counties: [
      { state: "25", county: "025", note: "Suffolk" },
      { state: "25", county: "017", note: "Middlesex (neighbor)" },
      { state: "25", county: "021", note: "Norfolk (neighbor)" },
      { state: "25", county: "009", note: "Essex MA (neighbor)" },
    ],
  },
];

export const DEFAULT_CITY_ID = "boston";

export function findCity(id: string): CityEntry | undefined {
  return CITIES.find((c) => c.id === id);
}
