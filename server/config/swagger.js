const swaggerJsDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'IMS SaaS API Documentation',
      version: '1.0.0',
      description: 'Professional API documentation for the Multi-Tenant Inventory Management System.',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        organizationId: {
          type: 'apiKey',
          in: 'header',
          name: 'x-organization-id',
          description: 'Organization ID for multi-tenant data isolation',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
        organizationId: [],
      },
    ],
  },
  apis: ['./routes/*.js', './models/*.js'], // Path to the API docs
};

const specs = swaggerJsDoc(options);
module.exports = specs;
