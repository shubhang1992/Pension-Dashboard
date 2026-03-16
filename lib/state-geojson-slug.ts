/**
 * Map @svg-maps/india state names to GeoJSON filenames from
 * https://github.com/udit-001/india-maps-data (geojson/states/*.geojson)
 */
export const STATE_NAME_TO_GEOJSON_SLUG: Record<string, string> = {
  'Andaman and Nicobar Islands': 'andaman-and-nicobar-islands',
  'Andhra Pradesh': 'andhra-pradesh',
  'Arunachal Pradesh': 'arunachal-pradesh',
  Assam: 'assam',
  Bihar: 'bihar',
  Chandigarh: 'chandigarh',
  Chhattisgarh: 'chhattisgarh',
  'Dadra and Nagar Haveli': 'dnh-and-dd',
  'Daman and Diu': 'dnh-and-dd',
  Delhi: 'delhi',
  Goa: 'goa',
  Gujarat: 'gujarat',
  Haryana: 'haryana',
  'Himachal Pradesh': 'himachal-pradesh',
  'Jammu and Kashmir': 'jammu-and-kashmir',
  Jharkhand: 'jharkhand',
  Karnataka: 'karnataka',
  Kerala: 'kerala',
  Lakshadweep: 'lakshadweep',
  'Madhya Pradesh': 'madhya-pradesh',
  Maharashtra: 'maharashtra',
  Manipur: 'manipur',
  Meghalaya: 'meghalaya',
  Mizoram: 'mizoram',
  Nagaland: 'nagaland',
  Odisha: 'odisha',
  Puducherry: 'puducherry',
  Punjab: 'punjab',
  Rajasthan: 'rajasthan',
  Sikkim: 'sikkim',
  'Tamil Nadu': 'tamil-nadu',
  Telangana: 'telangana',
  Tripura: 'tripura',
  'Uttar Pradesh': 'uttar-pradesh',
  Uttarakhand: 'uttarakhand',
  'West Bengal': 'west-bengal',
}

const GEOJSON_CDN =
  'https://raw.githubusercontent.com/udit-001/india-maps-data/main/geojson/states'

export function getStateGeoJsonUrl(stateName: string): string | null {
  const slug = STATE_NAME_TO_GEOJSON_SLUG[stateName]
  return slug ? `${GEOJSON_CDN}/${slug}.geojson` : null
}

export function hasStateGeoJson(stateName: string): boolean {
  return stateName in STATE_NAME_TO_GEOJSON_SLUG
}
