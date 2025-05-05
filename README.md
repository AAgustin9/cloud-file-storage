# Cloud File Storage

A secure cloud file storage provider manager service built with NestJS, featuring JWT authentication.

## Features

- JWT-based authentication
- File upload and download
- User management
- Swagger API documentation
- Automated testing with Jest
- CI/CD with GitHub Actions
- Code quality tools (ESLint, Prettier)
- Pre-commit hooks with Husky

## Installation

```bash
# Install dependencies
npm install

# Create uploads directory
mkdir uploads
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
JWT_SECRET=your-secret-key
```

## Running the Application

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## API Documentation

Once the application is running, you can access the Swagger API documentation at:

```
http://localhost:3000/api
```

## Testing

```bash
# Unit tests
npm run test

# e2e tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Code Quality

```bash
# Linting
npm run lint

# Formatting
npm run format
```

## License

This project is licensed under the MIT License. 