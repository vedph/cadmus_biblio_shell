import { WorkListEntry } from '@myrmidon/cadmus-biblio-core';
import { Part } from '@myrmidon/cadmus-core';

/**
 * The external bibliography part model.
 */
export interface ExtBibliographyPart extends Part {
  entries: WorkListEntry[];
}

/**
 * The type ID used to identify the ExtBibliographyPart type.
 */
export const EXT_BIBLIOGRAPHY_PART_TYPEID = 'it.vedph.ext-bibliography';

/**
 * JSON schema for the ExtBibliography part. This is used in the editor demo.
 * You can use the JSON schema tool at https://jsonschema.net/.
 */
export const EXT_BIBLIOGRAPHY_PART_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id:
    'www.vedph.it/cadmus/parts/biblio/' +
    EXT_BIBLIOGRAPHY_PART_TYPEID +
    '.json',
  type: 'object',
  title: 'ExtBibliographyPart',
  required: [
    'id',
    'itemId',
    'typeId',
    'timeCreated',
    'creatorId',
    'timeModified',
    'userId',
    'entries',
  ],
  properties: {
    timeCreated: {
      type: 'string',
      pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}.\\d+Z$',
    },
    creatorId: {
      type: 'string',
    },
    timeModified: {
      type: 'string',
      pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}.\\d+Z$',
    },
    userId: {
      type: 'string',
    },
    id: {
      type: 'string',
      pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
    },
    itemId: {
      type: 'string',
      pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
    },
    typeId: {
      type: 'string',
      pattern: '^[a-z][-0-9a-z._]*$',
    },
    roleId: {
      type: ['string', 'null'],
      pattern: '^([a-z][-0-9a-z._]*)?$',
    },
    entries: {
      type: 'array',
      items: {
        anyOf: [
          {
            type: 'object',
            required: ['id', 'label'],
            properties: {
              id: {
                type: 'string',
              },
              label: {
                type: 'string',
              },
              payload: {
                type: 'string',
              },
              tag: {
                type: 'string',
              },
              note: {
                type: 'string',
              },
            },
          },
        ],
      },
    },
  },
};
