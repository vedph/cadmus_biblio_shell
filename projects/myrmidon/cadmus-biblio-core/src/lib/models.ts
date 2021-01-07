export interface Author {
  id: string;
  first: string;
  last: string;
  suffix?: string;
}

export interface WorkAuthor extends Author {
  role?: string;
  ordinal?: number;
}

export interface Keyword {
  language: string;
  value: string;
}

export interface WorkBase {
  id: string;
  key: string;
  authors: WorkAuthor[];
  type: string;
  title: string;
  language: string;
  edition?: number;
  publisher?: string;
  yearPub?: number;
  placePub?: string;
  location?: string;
  accessDate?: Date;
  note?: string;
  keywords?: Keyword[];
}

export interface Container extends WorkBase {
  number?: string;
}

export interface Work extends WorkBase {
  container?: Container;
  firstPage?: number;
  lastPage?: number;
}
