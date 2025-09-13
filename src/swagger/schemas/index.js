/**
 * Central export for all Swagger schemas
 */

import { userSchemas } from './user.schemas.js';
import { commonSchemas } from './common.schemas.js';

export const allSchemas = {
  ...userSchemas,
  ...commonSchemas
};
