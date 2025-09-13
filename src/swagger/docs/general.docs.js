/**
 * General endpoints documentation
 */

export const generalDocs = {
  '/': {
    get: {
      summary: 'Health check endpoint',
      tags: ['General'],
      responses: {
        200: {
          description: 'API is running successfully',
          content: {
            'application/json': {
              schema: {
                type: 'string',
                example: "app run nasij_ward"
              }
            }
          }
        }
      }
    }
  },

  // Note: Catch-all route is handled by Express middleware, not documented as specific endpoint
};
