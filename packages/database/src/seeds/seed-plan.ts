import { IMPORTED_CITY_SEED_PLAN } from './city-seed-plan.js';
import { BUSINESS_TAXONOMY_SEED_PLAN } from './business-taxonomy-seed-plan.js';

export type CountrySeedPlan = {
  code2: string;
  code3: string;
  name: string;
  slug: string;
  citySlugs: string[];
};

export type CitySeedPlan = {
  countrySlug: string;
  name: string;
  slug: string;
};

export type CategorySeedPlan = {
  slug: string;
  name: string;
  isHighRisk: boolean;
};

type CountrySeedRow = readonly [
  code2: string,
  code3: string,
  name: string,
  primaryCity: string,
  extraCities?: readonly string[],
];

const COUNTRY_SEED_ROWS = [
  ['AF', 'AFG', 'Afghanistan', 'Kabul'],
  ['AX', 'ALA', 'Aland Islands', 'Mariehamn'],
  ['AL', 'ALB', 'Albania', 'Tirana'],
  ['DZ', 'DZA', 'Algeria', 'Algiers'],
  ['AS', 'ASM', 'American Samoa', 'Pago Pago'],
  ['AD', 'AND', 'Andorra', 'Andorra la Vella'],
  ['AO', 'AGO', 'Angola', 'Luanda'],
  ['AI', 'AIA', 'Anguilla', 'The Valley'],
  ['AQ', 'ATA', 'Antarctica', 'Antarctica'],
  ['AG', 'ATG', 'Antigua and Barbuda', "Saint John's"],
  ['AR', 'ARG', 'Argentina', 'Buenos Aires'],
  ['AM', 'ARM', 'Armenia', 'Yerevan'],
  ['AW', 'ABW', 'Aruba', 'Oranjestad'],
  ['AU', 'AUS', 'Australia', 'Canberra', ['Sydney', 'Melbourne']],
  ['AT', 'AUT', 'Austria', 'Vienna'],
  ['AZ', 'AZE', 'Azerbaijan', 'Baku'],
  ['BS', 'BHS', 'Bahamas', 'Nassau'],
  ['BH', 'BHR', 'Bahrain', 'Manama'],
  ['BD', 'BGD', 'Bangladesh', 'Dhaka'],
  ['BB', 'BRB', 'Barbados', 'Bridgetown'],
  ['BY', 'BLR', 'Belarus', 'Minsk'],
  ['BE', 'BEL', 'Belgium', 'Brussels', ['Antwerp']],
  ['BZ', 'BLZ', 'Belize', 'Belmopan'],
  ['BJ', 'BEN', 'Benin', 'Porto-Novo'],
  ['BM', 'BMU', 'Bermuda', 'Hamilton'],
  ['BT', 'BTN', 'Bhutan', 'Thimphu'],
  ['BO', 'BOL', 'Bolivia', 'Sucre'],
  ['BA', 'BIH', 'Bosnia and Herzegovina', 'Sarajevo'],
  ['BW', 'BWA', 'Botswana', 'Gaborone'],
  ['BV', 'BVT', 'Bouvet Island', 'Bouvet Island'],
  ['BR', 'BRA', 'Brazil', 'Brasilia', ['Sao Paulo', 'Rio de Janeiro']],
  ['IO', 'IOT', 'British Indian Ocean Territory', 'Diego Garcia'],
  ['VG', 'VGB', 'British Virgin Islands', 'Road Town'],
  ['BN', 'BRN', 'Brunei', 'Bandar Seri Begawan'],
  ['BG', 'BGR', 'Bulgaria', 'Sofia'],
  ['BF', 'BFA', 'Burkina Faso', 'Ouagadougou'],
  ['BI', 'BDI', 'Burundi', 'Gitega'],
  ['KH', 'KHM', 'Cambodia', 'Phnom Penh'],
  ['CM', 'CMR', 'Cameroon', 'Yaounde'],
  ['CA', 'CAN', 'Canada', 'Ottawa', ['Toronto', 'Vancouver']],
  ['CV', 'CPV', 'Cape Verde', 'Praia'],
  ['BQ', 'BES', 'Caribbean Netherlands', 'Kralendijk'],
  ['KY', 'CYM', 'Cayman Islands', 'George Town'],
  ['CF', 'CAF', 'Central African Republic', 'Bangui'],
  ['TD', 'TCD', 'Chad', "N'Djamena"],
  ['CL', 'CHL', 'Chile', 'Santiago'],
  ['CN', 'CHN', 'China', 'Beijing', ['Shanghai', 'Shenzhen', 'Guangzhou']],
  ['CX', 'CXR', 'Christmas Island', 'Flying Fish Cove'],
  ['CC', 'CCK', 'Cocos Keeling Islands', 'West Island'],
  ['CO', 'COL', 'Colombia', 'Bogota'],
  ['KM', 'COM', 'Comoros', 'Moroni'],
  ['CK', 'COK', 'Cook Islands', 'Avarua'],
  ['CR', 'CRI', 'Costa Rica', 'San Jose'],
  ['HR', 'HRV', 'Croatia', 'Zagreb'],
  ['CU', 'CUB', 'Cuba', 'Havana'],
  ['CW', 'CUW', 'Curacao', 'Willemstad'],
  ['CY', 'CYP', 'Cyprus', 'Nicosia'],
  ['CZ', 'CZE', 'Czechia', 'Prague'],
  ['DK', 'DNK', 'Denmark', 'Copenhagen'],
  ['DJ', 'DJI', 'Djibouti', 'Djibouti'],
  ['DM', 'DMA', 'Dominica', 'Roseau'],
  ['DO', 'DOM', 'Dominican Republic', 'Santo Domingo'],
  ['CD', 'COD', 'DR Congo', 'Kinshasa'],
  ['EC', 'ECU', 'Ecuador', 'Quito'],
  ['EG', 'EGY', 'Egypt', 'Cairo'],
  ['SV', 'SLV', 'El Salvador', 'San Salvador'],
  ['GQ', 'GNQ', 'Equatorial Guinea', 'Malabo'],
  ['ER', 'ERI', 'Eritrea', 'Asmara'],
  ['EE', 'EST', 'Estonia', 'Tallinn'],
  ['SZ', 'SWZ', 'Eswatini', 'Lobamba'],
  ['ET', 'ETH', 'Ethiopia', 'Addis Ababa'],
  ['FK', 'FLK', 'Falkland Islands', 'Stanley'],
  ['FO', 'FRO', 'Faroe Islands', 'Torshavn'],
  ['FJ', 'FJI', 'Fiji', 'Suva'],
  ['FI', 'FIN', 'Finland', 'Helsinki'],
  ['FR', 'FRA', 'France', 'Paris', ['Lyon', 'Marseille']],
  ['GF', 'GUF', 'French Guiana', 'Cayenne'],
  ['PF', 'PYF', 'French Polynesia', 'Papeete'],
  ['TF', 'ATF', 'French Southern and Antarctic Lands', 'Port-aux-Francais'],
  ['GA', 'GAB', 'Gabon', 'Libreville'],
  ['GM', 'GMB', 'Gambia', 'Banjul'],
  ['GE', 'GEO', 'Georgia', 'Tbilisi'],
  ['DE', 'DEU', 'Germany', 'Berlin', ['Munich', 'Frankfurt']],
  ['GH', 'GHA', 'Ghana', 'Accra'],
  ['GI', 'GIB', 'Gibraltar', 'Gibraltar'],
  ['GR', 'GRC', 'Greece', 'Athens'],
  ['GL', 'GRL', 'Greenland', 'Nuuk'],
  ['GD', 'GRD', 'Grenada', "St. George's"],
  ['GP', 'GLP', 'Guadeloupe', 'Basse-Terre'],
  ['GU', 'GUM', 'Guam', 'Hagatna'],
  ['GT', 'GTM', 'Guatemala', 'Guatemala City'],
  ['GG', 'GGY', 'Guernsey', 'St. Peter Port'],
  ['GN', 'GIN', 'Guinea', 'Conakry'],
  ['GW', 'GNB', 'Guinea-Bissau', 'Bissau'],
  ['GY', 'GUY', 'Guyana', 'Georgetown'],
  ['HT', 'HTI', 'Haiti', 'Port-au-Prince'],
  ['HM', 'HMD', 'Heard Island and McDonald Islands', 'Heard Island'],
  ['HN', 'HND', 'Honduras', 'Tegucigalpa'],
  ['HK', 'HKG', 'Hong Kong', 'City of Victoria'],
  ['HU', 'HUN', 'Hungary', 'Budapest'],
  ['IS', 'ISL', 'Iceland', 'Reykjavik'],
  ['IN', 'IND', 'India', 'New Delhi', ['Mumbai', 'Bengaluru', 'Delhi']],
  ['ID', 'IDN', 'Indonesia', 'Jakarta'],
  ['IR', 'IRN', 'Iran', 'Tehran'],
  ['IQ', 'IRQ', 'Iraq', 'Baghdad'],
  ['IE', 'IRL', 'Ireland', 'Dublin'],
  ['IM', 'IMN', 'Isle of Man', 'Douglas'],
  ['IL', 'ISR', 'Israel', 'Jerusalem'],
  ['IT', 'ITA', 'Italy', 'Rome', ['Milan']],
  ['CI', 'CIV', 'Ivory Coast', 'Yamoussoukro'],
  ['JM', 'JAM', 'Jamaica', 'Kingston'],
  ['JP', 'JPN', 'Japan', 'Tokyo', ['Osaka']],
  ['JE', 'JEY', 'Jersey', 'Saint Helier'],
  ['JO', 'JOR', 'Jordan', 'Amman'],
  ['KZ', 'KAZ', 'Kazakhstan', 'Astana'],
  ['KE', 'KEN', 'Kenya', 'Nairobi'],
  ['KI', 'KIR', 'Kiribati', 'South Tarawa'],
  ['XK', 'UNK', 'Kosovo', 'Pristina'],
  ['KW', 'KWT', 'Kuwait', 'Kuwait City'],
  ['KG', 'KGZ', 'Kyrgyzstan', 'Bishkek'],
  ['LA', 'LAO', 'Laos', 'Vientiane'],
  ['LV', 'LVA', 'Latvia', 'Riga'],
  ['LB', 'LBN', 'Lebanon', 'Beirut'],
  ['LS', 'LSO', 'Lesotho', 'Maseru'],
  ['LR', 'LBR', 'Liberia', 'Monrovia'],
  ['LY', 'LBY', 'Libya', 'Tripoli'],
  ['LI', 'LIE', 'Liechtenstein', 'Vaduz'],
  ['LT', 'LTU', 'Lithuania', 'Vilnius'],
  ['LU', 'LUX', 'Luxembourg', 'Luxembourg'],
  ['MO', 'MAC', 'Macau', 'Macau'],
  ['MG', 'MDG', 'Madagascar', 'Antananarivo'],
  ['MW', 'MWI', 'Malawi', 'Lilongwe'],
  ['MY', 'MYS', 'Malaysia', 'Kuala Lumpur'],
  ['MV', 'MDV', 'Maldives', 'Male'],
  ['ML', 'MLI', 'Mali', 'Bamako'],
  ['MT', 'MLT', 'Malta', 'Valletta'],
  ['MH', 'MHL', 'Marshall Islands', 'Majuro'],
  ['MQ', 'MTQ', 'Martinique', 'Fort-de-France'],
  ['MR', 'MRT', 'Mauritania', 'Nouakchott'],
  ['MU', 'MUS', 'Mauritius', 'Port Louis'],
  ['YT', 'MYT', 'Mayotte', 'Mamoudzou'],
  ['MX', 'MEX', 'Mexico', 'Mexico City'],
  ['FM', 'FSM', 'Micronesia', 'Palikir'],
  ['MD', 'MDA', 'Moldova', 'Chisinau'],
  ['MC', 'MCO', 'Monaco', 'Monaco'],
  ['MN', 'MNG', 'Mongolia', 'Ulan Bator'],
  ['ME', 'MNE', 'Montenegro', 'Podgorica'],
  ['MS', 'MSR', 'Montserrat', 'Plymouth'],
  ['MA', 'MAR', 'Morocco', 'Rabat'],
  ['MZ', 'MOZ', 'Mozambique', 'Maputo'],
  ['MM', 'MMR', 'Myanmar', 'Naypyidaw'],
  ['NA', 'NAM', 'Namibia', 'Windhoek'],
  ['NR', 'NRU', 'Nauru', 'Yaren'],
  ['NP', 'NPL', 'Nepal', 'Kathmandu'],
  ['NL', 'NLD', 'Netherlands', 'Amsterdam', ['Rotterdam']],
  ['NC', 'NCL', 'New Caledonia', 'Noumea'],
  ['NZ', 'NZL', 'New Zealand', 'Wellington'],
  ['NI', 'NIC', 'Nicaragua', 'Managua'],
  ['NE', 'NER', 'Niger', 'Niamey'],
  ['NG', 'NGA', 'Nigeria', 'Abuja'],
  ['NU', 'NIU', 'Niue', 'Alofi'],
  ['NF', 'NFK', 'Norfolk Island', 'Kingston'],
  ['KP', 'PRK', 'North Korea', 'Pyongyang'],
  ['MK', 'MKD', 'North Macedonia', 'Skopje'],
  ['MP', 'MNP', 'Northern Mariana Islands', 'Saipan'],
  ['NO', 'NOR', 'Norway', 'Oslo'],
  ['OM', 'OMN', 'Oman', 'Muscat'],
  ['PK', 'PAK', 'Pakistan', 'Islamabad'],
  ['PW', 'PLW', 'Palau', 'Ngerulmud'],
  ['PS', 'PSE', 'Palestine', 'Ramallah'],
  ['PA', 'PAN', 'Panama', 'Panama City'],
  ['PG', 'PNG', 'Papua New Guinea', 'Port Moresby'],
  ['PY', 'PRY', 'Paraguay', 'Asuncion'],
  ['PE', 'PER', 'Peru', 'Lima'],
  ['PH', 'PHL', 'Philippines', 'Manila'],
  ['PN', 'PCN', 'Pitcairn Islands', 'Adamstown'],
  ['PL', 'POL', 'Poland', 'Warsaw'],
  ['PT', 'PRT', 'Portugal', 'Lisbon'],
  ['PR', 'PRI', 'Puerto Rico', 'San Juan'],
  ['QA', 'QAT', 'Qatar', 'Doha'],
  ['CG', 'COG', 'Republic of the Congo', 'Brazzaville'],
  ['RE', 'REU', 'Reunion', 'Saint-Denis'],
  ['RO', 'ROU', 'Romania', 'Bucharest'],
  ['RU', 'RUS', 'Russia', 'Moscow'],
  ['RW', 'RWA', 'Rwanda', 'Kigali'],
  ['BL', 'BLM', 'Saint Barthelemy', 'Gustavia'],
  ['SH', 'SHN', 'Saint Helena Ascension and Tristan da Cunha', 'Jamestown'],
  ['KN', 'KNA', 'Saint Kitts and Nevis', 'Basseterre'],
  ['LC', 'LCA', 'Saint Lucia', 'Castries'],
  ['MF', 'MAF', 'Saint Martin', 'Marigot'],
  ['PM', 'SPM', 'Saint Pierre and Miquelon', 'Saint-Pierre'],
  ['VC', 'VCT', 'Saint Vincent and the Grenadines', 'Kingstown'],
  ['WS', 'WSM', 'Samoa', 'Apia'],
  ['SM', 'SMR', 'San Marino', 'City of San Marino'],
  ['ST', 'STP', 'Sao Tome and Principe', 'Sao Tome'],
  ['SA', 'SAU', 'Saudi Arabia', 'Riyadh'],
  ['SN', 'SEN', 'Senegal', 'Dakar'],
  ['RS', 'SRB', 'Serbia', 'Belgrade'],
  ['SC', 'SYC', 'Seychelles', 'Victoria'],
  ['SL', 'SLE', 'Sierra Leone', 'Freetown'],
  ['SG', 'SGP', 'Singapore', 'Singapore'],
  ['SX', 'SXM', 'Sint Maarten', 'Philipsburg'],
  ['SK', 'SVK', 'Slovakia', 'Bratislava'],
  ['SI', 'SVN', 'Slovenia', 'Ljubljana'],
  ['SB', 'SLB', 'Solomon Islands', 'Honiara'],
  ['SO', 'SOM', 'Somalia', 'Mogadishu'],
  ['ZA', 'ZAF', 'South Africa', 'Pretoria'],
  ['GS', 'SGS', 'South Georgia', 'King Edward Point'],
  ['KR', 'KOR', 'South Korea', 'Seoul'],
  ['SS', 'SSD', 'South Sudan', 'Juba'],
  ['ES', 'ESP', 'Spain', 'Madrid', ['Barcelona']],
  ['LK', 'LKA', 'Sri Lanka', 'Colombo'],
  ['SD', 'SDN', 'Sudan', 'Khartoum'],
  ['SR', 'SUR', 'Suriname', 'Paramaribo'],
  ['SJ', 'SJM', 'Svalbard and Jan Mayen', 'Longyearbyen'],
  ['SE', 'SWE', 'Sweden', 'Stockholm'],
  ['CH', 'CHE', 'Switzerland', 'Bern', ['Zurich']],
  ['SY', 'SYR', 'Syria', 'Damascus'],
  ['TW', 'TWN', 'Taiwan', 'Taipei'],
  ['TJ', 'TJK', 'Tajikistan', 'Dushanbe'],
  ['TZ', 'TZA', 'Tanzania', 'Dodoma'],
  ['TH', 'THA', 'Thailand', 'Bangkok'],
  ['TL', 'TLS', 'Timor-Leste', 'Dili'],
  ['TG', 'TGO', 'Togo', 'Lome'],
  ['TK', 'TKL', 'Tokelau', 'Fakaofo'],
  ['TO', 'TON', 'Tonga', "Nuku'alofa"],
  ['TT', 'TTO', 'Trinidad and Tobago', 'Port of Spain'],
  ['TN', 'TUN', 'Tunisia', 'Tunis'],
  ['TR', 'TUR', 'Turkiye', 'Ankara'],
  ['TM', 'TKM', 'Turkmenistan', 'Ashgabat'],
  ['TC', 'TCA', 'Turks and Caicos Islands', 'Cockburn Town'],
  ['TV', 'TUV', 'Tuvalu', 'Funafuti'],
  ['UG', 'UGA', 'Uganda', 'Kampala'],
  ['UA', 'UKR', 'Ukraine', 'Kyiv', ['Lviv', 'Odesa']],
  ['AE', 'ARE', 'United Arab Emirates', 'Abu Dhabi', ['Dubai']],
  ['GB', 'GBR', 'United Kingdom', 'London', ['Manchester']],
  [
    'US',
    'USA',
    'United States',
    'Washington D.C.',
    ['New York', 'Miami', 'Los Angeles', 'Chicago'],
  ],
  ['UM', 'UMI', 'United States Minor Outlying Islands', 'United States Minor Outlying Islands'],
  ['VI', 'VIR', 'United States Virgin Islands', 'Charlotte Amalie'],
  ['UY', 'URY', 'Uruguay', 'Montevideo'],
  ['UZ', 'UZB', 'Uzbekistan', 'Tashkent'],
  ['VU', 'VUT', 'Vanuatu', 'Port Vila'],
  ['VA', 'VAT', 'Vatican City', 'Vatican City'],
  ['VE', 'VEN', 'Venezuela', 'Caracas'],
  ['VN', 'VNM', 'Vietnam', 'Hanoi'],
  ['WF', 'WLF', 'Wallis and Futuna', 'Mata-Utu'],
  ['EH', 'ESH', 'Western Sahara', 'El Aaiun'],
  ['YE', 'YEM', 'Yemen', "Sana'a"],
  ['ZM', 'ZMB', 'Zambia', 'Lusaka'],
  ['ZW', 'ZWE', 'Zimbabwe', 'Harare'],
] as const satisfies readonly CountrySeedRow[];

function slugifySeedValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getCityNames(primaryCity: string, extraCities: readonly string[] = []): string[] {
  const seenCitySlugs = new Set<string>();

  return [primaryCity, ...extraCities].filter((cityName) => {
    const citySlug = slugifySeedValue(cityName);
    if (!citySlug || seenCitySlugs.has(citySlug)) return false;

    seenCitySlugs.add(citySlug);
    return true;
  });
}

export const COUNTRY_SEED_PLAN: readonly CountrySeedPlan[] = COUNTRY_SEED_ROWS.map(
  ([code2, code3, name, primaryCity, extraCities]) => ({
    code2,
    code3,
    name,
    slug: slugifySeedValue(name),
    citySlugs: getCityNames(primaryCity, extraCities).map((cityName) => slugifySeedValue(cityName)),
  }),
);

const FALLBACK_CITY_SEED_PLAN: readonly CitySeedPlan[] = COUNTRY_SEED_ROWS.flatMap(
  ([, , countryName, primaryCity, extraCities]) => {
    const countrySlug = slugifySeedValue(countryName);

    return getCityNames(primaryCity, extraCities).map((cityName) => ({
      countrySlug,
      name: cityName,
      slug: slugifySeedValue(cityName),
    }));
  },
);

function mergeCitySeedPlans(
  importedCities: readonly CitySeedPlan[],
  fallbackCities: readonly CitySeedPlan[],
): readonly CitySeedPlan[] {
  const seenCityKeys = new Set<string>();
  const mergedCities: CitySeedPlan[] = [];

  for (const city of [...importedCities, ...fallbackCities]) {
    const cityKey = `${city.countrySlug}:${city.slug}`;
    if (seenCityKeys.has(cityKey)) continue;

    seenCityKeys.add(cityKey);
    mergedCities.push(city);
  }

  return mergedCities;
}

export const CITY_SEED_PLAN: readonly CitySeedPlan[] = mergeCitySeedPlans(
  IMPORTED_CITY_SEED_PLAN,
  FALLBACK_CITY_SEED_PLAN,
);

export const CATEGORY_SEED_PLAN: readonly CategorySeedPlan[] = [
  ...BUSINESS_TAXONOMY_SEED_PLAN.map((item) => ({
    slug: item.subcategorySlug,
    name: item.subcategoryName,
    isHighRisk: false,
  })),
  { slug: 'crypto', name: 'Cryptocurrency & Digital Assets', isHighRisk: true },
  { slug: 'gambling', name: 'Gambling & Betting', isHighRisk: true },
  { slug: 'adult', name: 'Adult Content & Services', isHighRisk: true },
  { slug: 'firearms', name: 'Firearms & Weapons', isHighRisk: true },
  { slug: 'unlicensed-financial', name: 'Unlicensed Financial Services', isHighRisk: true },
  { slug: 'high-risk-investments', name: 'High-Risk Investment Schemes', isHighRisk: true },
];

export { BUSINESS_TAXONOMY_SEED_PLAN };

export const ADMIN_BOOTSTRAP_PLAN = {
  ownerAccountRequired: true,
  ownerPhoneEnv: 'ADMIN_BOOTSTRAP_OWNER_PHONE',
  ownerPasswordEnv: 'ADMIN_BOOTSTRAP_OWNER_PASSWORD',
  optionalStagingRoles: ['ADMIN', 'MODERATOR'] as const,
  note: 'Seed or provision the initial OWNER from ADMIN_BOOTSTRAP_OWNER_PHONE and ADMIN_BOOTSTRAP_OWNER_PASSWORD, then manage staff roles through OWNER-only admin UI.',
} as const;

export const CONFIG_SEED_PLAN = {
  stripePriceKeys: [
    'stripe_price_vip_membership_monthly',
    'stripe_price_business_placement_monthly',
  ] as const,
  initialAdminConfigKeys: ['platform_settings', 'directory_settings'] as const,
} as const;

if (import.meta.main) {
  console.log(
    JSON.stringify(
      {
        countries: COUNTRY_SEED_PLAN,
        cities: CITY_SEED_PLAN,
        categories: CATEGORY_SEED_PLAN,
        adminBootstrap: ADMIN_BOOTSTRAP_PLAN,
        config: CONFIG_SEED_PLAN,
      },
      null,
      2,
    ),
  );
}
