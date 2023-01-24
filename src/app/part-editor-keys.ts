import { PartEditorKeys } from '@myrmidon/cadmus-core';
import {
  METADATA_PART_TYPEID,
  NOTE_PART_TYPEID,
} from '@myrmidon/cadmus-part-general-ui';
import { EXT_BIBLIOGRAPHY_PART_TYPEID } from '@myrmidon/cadmus-part-biblio-ui';

const GENERAL = 'general';
const BIBLIO = 'biblio';

/**
 * The parts and fragments editor keys for this UI.
 * Each property is a part type ID, mapped to a value of type PartGroupKey,
 * having a part property with the part's editor key, and a fragments property
 * with the mappings between fragment type IDs and their editor keys.
 */
export const PART_EDITOR_KEYS: PartEditorKeys = {
  // general
  [METADATA_PART_TYPEID]: {
    part: GENERAL,
  },
  [NOTE_PART_TYPEID]: {
    part: GENERAL,
  },
  // biblio
  [EXT_BIBLIOGRAPHY_PART_TYPEID]: {
    part: BIBLIO,
  },
};
