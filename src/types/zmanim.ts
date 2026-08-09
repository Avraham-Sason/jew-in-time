export type Location = {
  lat: number;
  lng: number;
  tz: string;
  name: string;
  nameEn?: string;
  inIsrael: boolean;
  elevation?: number;
  // Local minhag override for candle lighting, in minutes before shkia.
  candleLightingMinutes?: number;
};

export type Zmanim = {
  alotHaShachar: Date;
  misheyakir: Date;
  netzHaChama: Date;
  sofZmanShmaGra: Date;
  sofZmanShmaMA: Date;
  sofZmanTfilaGra: Date;
  chatzot: Date;
  chatzotLayla: Date;
  minchaGedola: Date;
  minchaKetana: Date;
  plagHaMincha: Date;
  shkia: Date;
  tzeitHakochavim: Date;
  candleLighting?: Date;
  havdalah?: Date;
};

export type ZmanimKey = keyof Zmanim;

export type HebrewDate = {
  year: number;
  month: number;
  day: number;
  hebrewYearStr: string;
  hebrewDateStr: string;
};

export type CalendarInfo = {
  hebrew: HebrewDate;
  parasha?: string;
  holidays: string[];
  isShabbat: boolean;
  isYomTov: boolean;
  omerDay?: number;
  dafYomi?: string;
};
