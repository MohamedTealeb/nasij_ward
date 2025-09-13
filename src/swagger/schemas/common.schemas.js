add/**
 * Common/shared Swagger schemas
 */

export const commonSchemas = {
  SuccessResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true
      },
      message: {
        type: 'string',
        example: 'Operation completed successfully'
      },
      data: {
        type: 'object',
        description: 'Response data'
      }
    }
  },

  ErrorResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: false
      },
      message: {
        type: 'string',
        example: 'An error occurred'
      },
      errors: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              example: 'body'
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Validation error message'
                  },
                  path: {
                    type: 'string',
                    example: 'fieldName'
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  LoginCredentials: {
    type: 'object',
    properties: {
      accessToken: {
        type: 'string',
        description: 'JWT access token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      },
      refreshToken: {
        type: 'string',
        description: 'JWT refresh token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      }
    }
  }
};
