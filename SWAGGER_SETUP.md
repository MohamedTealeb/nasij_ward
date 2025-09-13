# Swagger API Documentation Setup

This document provides information about the Swagger API documentation setup for the Nasij Ward project.

## Overview

Swagger UI has been integrated into your Node.js Express application using a simple YAML configuration file. The documentation includes all available endpoints, request/response schemas, and examples.

## Access the Documentation

Once your server is running, you can access the Swagger UI at:

```
http://localhost:{PORT}/api-docs
```

Replace `{PORT}` with your actual port number (check your .env file for the PORT variable).

## Features

### 🔧 **Comprehensive API Documentation**
- **Authentication Endpoints**: Complete documentation for signup and login
- **Request/Response Schemas**: Detailed schema definitions with validation rules
- **Interactive Testing**: Test API endpoints directly from the documentation
- **Security Schemes**: JWT Bearer token authentication support

### 📋 **Documented Endpoints**

#### Authentication (`/auth`)
- `POST /auth/signup` - Register a new user
- `POST /auth/login` - Authenticate user and get access tokens

#### General
- `GET /` - Health check endpoint
- `ALL /*` - Catch-all for undefined routes (404)

### 🎨 **UI Customizations**
- Custom site title: "Nasij Ward API Documentation"
- Hidden top bar for cleaner interface
- Persistent authorization (JWT tokens stay after page refresh)
- Request duration display
- Explorer mode enabled

## Schema Components

The documentation includes reusable schema components:

- **User**: Complete user model with all fields
- **UserSignup**: Registration request schema
- **UserLogin**: Login request schema  
- **SuccessResponse**: Standard success response format
- **ErrorResponse**: Standard error response format
- **LoginCredentials**: JWT token response format

## Security

JWT Bearer token authentication is configured. To test protected endpoints:

1. Login via `/auth/login` endpoint
2. Copy the `accessToken` from the response
3. Click the "Authorize" button in Swagger UI
4. Enter: `Bearer <your-access-token>`
5. Test protected endpoints

## File Structure

```
project-root/
├── swagger.yaml              # Complete Swagger documentation in YAML format
├── src/
│   ├── modules/
│   │   └── auth/
│   │       └── auth.controller.js # Clean controller
│   └── app.controller.js     # Main app with Swagger middleware
└── package.json              # Dependencies including js-yaml
```

## Customization

### Adding New Endpoints

Simply edit the `swagger.yaml` file and add your new endpoint under the `paths` section:

```yaml
paths:
  /your-new-endpoint:
    post:
      summary: Your endpoint description
      tags: [YourTag]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/YourSchema'
      responses:
        '200':
          description: Success response
```

### Adding New Schemas

Add new schema definitions to the `components.schemas` section in `swagger.yaml`:

```yaml
components:
  schemas:
    YourNewSchema:
      type: object
      required:
        - field1
        - field2
      properties:
        field1:
          type: string
          description: Field description
          example: "Example value"
```

## Environment Configuration

The Swagger configuration automatically adapts to your environment:

- **Development**: `http://localhost:{PORT}`
- **Production**: `https://api.nasijward.com` (update as needed)

## Best Practices

1. **Keep Documentation Updated**: Always update Swagger comments when modifying endpoints
2. **Use Examples**: Provide realistic examples in your schemas
3. **Tag Organization**: Group related endpoints using consistent tags
4. **Error Documentation**: Document all possible error responses
5. **Security**: Always specify authentication requirements for protected routes

## Troubleshooting

### Common Issues

1. **Swagger UI not loading**: Check that swagger-ui-express and swagger-jsdoc are installed
2. **Documentation not updating**: Restart your server after making changes to JSDoc comments
3. **Schemas not found**: Ensure schema names match exactly between definitions and references

### Debug Mode

To see the generated OpenAPI specification object, add this to your app:

```javascript
app.get('/api-docs.json', (req, res) => {
  res.json(swaggerSpecs);
});
```

This will expose the raw OpenAPI JSON at `/api-docs.json` for debugging.

## Next Steps

Consider adding:

- **More Endpoints**: Document additional API endpoints as you develop them
- **Authentication Middleware**: Document protected routes with security requirements
- **Response Examples**: Add more comprehensive response examples
- **API Versioning**: Implement and document API versioning strategy
- **Rate Limiting**: Document rate limiting policies
- **Webhooks**: Document webhook endpoints if applicable

---

**Happy API Documentation!** 🚀

