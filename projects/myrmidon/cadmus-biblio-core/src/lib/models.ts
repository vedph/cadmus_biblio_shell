/**
 * An author.
 */
export interface Author {
  id?: string;
  first: string;
  last: string;
  suffix?: string;
}

/**
 * An author assigned to a work.
 */
export interface WorkAuthor extends Author {
  role?: string;
  ordinal?: number;
}

/**
 * A keyword.
 */
export interface Keyword {
  language: string;
  value: string;
}

/**
 * External ID used for work and container links.
 */
export interface ExternalId {
  sourceId: string;
  scope: string;
  value: string;
}

/**
 * A work container.
 */
export interface Container {
  id?: string;
  key: string;
  authors?: WorkAuthor[];
  type: string;
  title: string;
  language: string;
  edition?: number;
  publisher?: string;
  number?: string;
  yearPub?: number;
  yearPub2?: number;
  placePub?: string;
  location?: string;
  accessDate?: Date;
  note?: string;
  datation?: string;
  datationValue?: number;
  keywords?: Keyword[];
  links?: ExternalId[];
}

/**
 * A work.
 */
export interface Work extends Container {
  container?: Container;
  firstPage?: number;
  lastPage?: number;
}

/**
 * A work being edited in the UI.
 */
export interface EditedWork extends Work {
  isContainer?: boolean;
}

/**
 * Essential information about a work or container.
 */
export interface WorkInfo {
  isContainer: boolean;
  id: string;
  key: string;
  authors: WorkAuthor[];
  type: string;
  title: string;
  language: string;
  edition: number;
  yearPub: number;
  placePub: string;
  number?: string;
  firstPage?: number;
  lastPage?: number;
  keywords?: Keyword[];
  container?: Container;
}

/**
 * Server paging options.
 */
export interface PagingOptions {
  pageNumber: number;
  pageSize: number;
}

/**
 * Work's type.
 */
export interface WorkType {
  id: string;
  name: string;
}

/**
 * An entry in a list of selected works.
 * This is a generic model which does not imply the usage
 * of the models in this library. Each entry just has a
 * string ID (here corresponding to a GUID) for the work,
 * a human-readable label for it, and a general purpose
 * payload string to carry additional information which
 * might be useful in the context of the external database.
 * In our library, the payload is equal to "c" for
 * containers, and undefined or null for works.
 */
export interface WorkListEntry {
  id: string;
  label: string;
  payload?: string;
  tag?: string;
  note?: string;
}
