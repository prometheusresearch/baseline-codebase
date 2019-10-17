/**
 * @flow
 */

export const SCHEMA_QUERY = `
 {
     __schema {
         types {
             name
             fields {
                 name
                 description
                 type {
                     name
                     kind
                 }
             }
         }
     }
 }
 `;
