import swaggerJsdoc from 'swagger-jsdoc';
import { allSchemas } from './schemas/index.js';
import { commonResponses } from './responses.js';
import { authDocs } from './docs/auth.docs.js';
import { generalDocs } from './docs/general.docs.js';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Nasij Ward API',
      version: '1.0.0',
      description: 'A comprehensive API for the Nasij Ward application with user authentication and management features.',
      contact: {
        name: 'API Support',
        email: 'support@nasijward.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://api.nasijward.com' 
          : `http://localhost:${process.env.PORT || 3000}`,
        description: process.env.NODE_ENV === 'production' 
          ? 'Production server' 
          : 'Development server'
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and registration endpoints'
      },
      {
        name: 'General',
        description: 'General application endpoints'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token in the format: Bearer <token>'
        }
      },
      schemas: allSchemas,
      responses: commonResponses
    },
    paths: {
      ...authDocs,
      ...generalDocs
    }
  },
  apis: [
    // Keep this for JSDoc comments in controller files if needed
    './src/modules/auth/auth.controller.js',
    './src/app.controller.js'
  ]
};

const specs = swaggerJsdoc(options);
export default specs;
