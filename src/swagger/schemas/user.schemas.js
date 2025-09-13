/**
 * User-related Swagger schemas
 */

export const userSchemas = {
  User: {
    type: 'object',
    required: ['firstName', 'lastName', 'email', 'password', 'phone'],
    properties: {
      _id: {
        type: 'string',
        description: 'Unique identifier for the user',
        example: '64b8c8f5e123456789abcdef'
      },
      firstName: {
        type: 'string',
        minLength: 3,
        maxLength: 20,
        description: 'User first name',
        example: 'John'
      },
      lastName: {
        type: 'string',
        minLength: 3,
        maxLength: 20,
        description: 'User last name',
        example: 'Doe'
      },
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address',
        example: 'john.doe@example.com'
      },
      password: {
        type: 'string',
        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[A-Za-z\\d]{8,}$',
        description: 'User password (at least 8 characters, 1 uppercase, 1 lowercase, 1 number)',
        example: 'Password123'
      },
      phone: {
        type: 'string',
        pattern: '^(002|\\+2)?01[0125][0-9]{8}$',
        description: 'Egyptian phone number',
        example: '01234567890'
      },
      gender: {
        type: 'string',
        enum: ['male', 'female'],
        default: 'male',
        description: 'User gender'
      },
      role: {
        type: 'string',
        enum: ['user', 'admin'],
        default: 'user',
        description: 'User role'
      },
      confirmEmail: {
        type: 'string',
        format: 'date-time',
        description: 'Email confirmation timestamp'
      },
      confirmEmailOtp: {
        type: 'string',
        description: 'OTP for email confirmation'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Account creation timestamp'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        description: 'Last update timestamp'
      }
    }
  },

  UserSignup: {
    type: 'object',
    required: ['firstName', 'lastName', 'email', 'password', 'phone'],
    properties: {
      firstName: {
        type: 'string',
        minLength: 3,
        description: 'User first name',
        example: 'John'
      },
      lastName: {
        type: 'string',
        minLength: 3,
        description: 'User last name',
        example: 'Doe'
      },
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address',
        example: 'john.doe@example.com'
      },
      password: {
        type: 'string',
        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[A-Za-z\\d]{8,}$',
        description: 'Password (min 8 chars, 1 uppercase, 1 lowercase, 1 number)',
        example: 'Password123'
      },
      phone: {
        type: 'string',
        pattern: '^(002|\\+2)?01[0125][0-9]{8}$',
        description: 'Egyptian phone number',
        example: '01234567890'
      }
    }
  },

  UserLogin: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address',
        example: 'john.doe@example.com'
      },
      password: {
        type: 'string',
        description: 'User password',
        example: 'Password123'
      }
    }
  }
};
