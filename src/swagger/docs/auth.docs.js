/**
 * Authentication endpoints documentation
 */

export const authDocs = {
  '/auth/signup': {
    post: {
      summary: 'Register a new user',
      tags: ['Authentication'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UserSignup'
            },
            example: {
              firstName: "John",
              lastName: "Doe",
              email: "john.doe@example.com",
              password: "Password123",
              phone: "01234567890"
            }
          }
        }
      },
      responses: {
        200: {
          description: 'User created successfully',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          NewUser: {
                            $ref: '#/components/schemas/User'
                          }
                        }
                      }
                    }
                  }
                ]
              },
              example: {
                success: true,
                message: "User created successfully",
                data: {
                  NewUser: {
                    _id: "64b8c8f5e123456789abcdef",
                    firstName: "John",
                    lastName: "Doe",
                    email: "john.doe@example.com",
                    gender: "male",
                    role: "user",
                    createdAt: "2023-07-20T10:30:00.000Z",
                    updatedAt: "2023-07-20T10:30:00.000Z"
                  }
                }
              }
            }
          }
        },
        400: {
          $ref: '#/components/responses/ValidationError'
        },
        409: {
          $ref: '#/components/responses/UserAlreadyExists'
        }
      }
    }
  },

  '/auth/login': {
    post: {
      summary: 'Authenticate user and get access tokens',
      tags: ['Authentication'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UserLogin'
            },
            example: {
              email: "john.doe@example.com",
              password: "Password123"
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Login successful',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          user: {
                            $ref: '#/components/schemas/User'
                          },
                          credentials: {
                            $ref: '#/components/schemas/LoginCredentials'
                          }
                        }
                      }
                    }
                  }
                ]
              },
              example: {
                success: true,
                message: "Login successful",
                data: {
                  user: {
                    _id: "64b8c8f5e123456789abcdef",
                    firstName: "John",
                    lastName: "Doe",
                    email: "john.doe@example.com",
                    gender: "male",
                    role: "user"
                  },
                  credentials: {
                    accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                    refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  }
                }
              }
            }
          }
        },
        400: {
          $ref: '#/components/responses/ValidationError'
        },
        401: {
          $ref: '#/components/responses/Unauthorized'
        },
        404: {
          description: 'User not found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: "user not found"
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
