/**
 * Common Swagger response definitions
 */

export const commonResponses = {
  ValidationError: {
    description: 'Validation Error',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/ErrorResponse'
        }
      }
    }
  },

  NotFound: {
    description: 'Resource not found',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Page not found'
            }
          }
        }
      }
    }
  },

  Unauthorized: {
    description: 'Unauthorized access',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Invalid login data'
            }
          }
        }
      }
    }
  },

  UserAlreadyExists: {
    description: 'User already exists',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'User already exists'
            }
          }
        }
      }
    }
  }
};
