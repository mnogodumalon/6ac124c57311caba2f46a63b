// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Hunde {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    hundename?: string;
    rasse?: string;
    geschlecht?: LookupValue;
    geburtsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    bemerkungen?: string;
    halter_vorname?: string;
    halter_nachname?: string;
    halter_email?: string;
    halter_telefon?: string;
  };
}

export const APP_IDS = {
  HUNDE: '6ac124bb4530c4453a113863',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'hunde': {
    geschlecht: [{ key: "ruede", label: "Rüde" }, { key: "huendin", label: "Hündin" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'hunde': {
    'hundename': 'string/text',
    'rasse': 'string/text',
    'geschlecht': 'lookup/radio',
    'geburtsdatum': 'date/date',
    'bemerkungen': 'string/textarea',
    'halter_vorname': 'string/text',
    'halter_nachname': 'string/text',
    'halter_email': 'string/email',
    'halter_telefon': 'string/tel',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateHunde = StripLookup<Hunde['fields']>;