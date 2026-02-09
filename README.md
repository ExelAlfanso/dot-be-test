# Inventory Management System

NestJS-based inventory management API with JWT authentication, role-based access control, and inventory movement tracking backed by PostgreSQL via Prisma.

## Core Resources and CRUD

- **Products**
  - Create: `POST /api/products`
  - Read: `GET /api/products`, `GET /api/products/:id`
  - Update: `PATCH /api/products/:id`
  - Delete: `DELETE /api/products/:id`
- **Inventory Movements**
  - Create movement (IN/OUT/ADJUSTMENT): `POST /api/inventory-movements`
  - List all: `GET /api/inventory-movements`
  - History per product: `GET /api/inventory-movements/product/:productId`
- **Profiles**
  - Read: `GET /api/profile`
  - Update: `PATCH /api/profile`
- **Auth**
  - Register: `POST /api/auth/register`
  - Login: `POST /api/auth/login`

## Architecture and Folder Structure

- `src/`
  - `main.ts` and `app.module.ts`: application bootstrap and root module
  - `auth/`: authentication module, JWT strategy, roles, and guards
  - `products/`: product module with controller, service, and DTOs
  - `inventory/`: inventory movement module with controller, service, and DTOs
  - `profiles/`: profile module with controller, service, and DTOs
  - `prisma/`: Prisma module and service
  - `common/`: shared guards, filters, interceptors, and DTOs
- `prisma/`
  - `schema.prisma`: database schema
  - `migrations/`: migration history
  - `seed.ts`: seed script
- `test/`: end-to-end tests

## Architecture Pattern

This project uses a Modular NestJS Architecture combined with:

- Service Layer Pattern
- Repository Pattern (via Prisma)
- RBAC with Decorator Pattern
- Separation of Concerns per domain module

**Why this structure**

- Feature modules keep controllers, services, and DTOs scoped to one domain
- `common/` avoids duplicated guards, filters, interceptors, and DTOs
- `prisma/` centralizes the data layer and keeps schema, migrations, and seed in one place
- `test/` separates e2e tests from production code
- The layout scales as new domains are added without mixing responsibilities

## Why This Architecture Was Chosen

The project intentionally avoids full Clean Architecture to keep:

- Development velocity high
- Folder structure understandable for small teams
- Complexity proportional to project scope

## Notes

- Environment variables must be set (DATABASE_URL, JWT_SECRET)
- Seed the database with `npm run prisma:seed` when you need initial data

## Testing

### End-to-End Testing

This directory contains comprehensive e2e tests for the NestJS Inventory Management System.

#### Test Files

##### `auth.e2e-spec.ts`

Tests authentication functionality:

- **POST /api/auth/register**: User registration with validation
  - Valid registration
  - Invalid email format
  - Weak password validation
  - Short username validation
  - Duplicate email prevention
  - Extra fields rejection
- **POST /api/auth/login**: User authentication
  - Successful login
  - Wrong password handling
  - Non-existent user handling
  - Invalid email format

##### `profile.e2e-spec.ts`

Tests profile management functionality:

- **GET /api/profile**: User profile retrieval
  - USER role profile
  - ADMIN role profile
  - Missing token handling
- **PATCH /api/profile**: Update current user profile
  - Update username
  - Update email
  - Update password
  - Duplicate email/username handling
  - Missing token handling

##### `products.e2e-spec.ts`

Tests product management functionality:

- **POST /api/products**: Create products
  - Successful creation with all fields
  - Creation with optional fields omitted
  - Authentication requirement
  - Missing required fields validation
  - Invalid data types handling
  - Stock maximum validation
- **GET /api/products**: List all products
  - Retrieved without authentication
  - Empty array when no products exist
- **GET /api/products/:id**: Get single product
  - Successful retrieval
  - 404 for non-existent product
- **PATCH /api/products/:id**: Update product
  - Update own product successfully
  - Update single field only
  - Ownership validation (cannot update other user's product)
  - Authentication requirement
  - 404 for non-existent product
- **DELETE /api/products/:id**: Delete product
  - Delete own product successfully
  - Ownership validation (cannot delete other user's product)
  - Authentication requirement
  - 404 for non-existent product

##### `inventory.e2e-spec.ts`

Tests inventory management functionality:

- **POST /api/inventory-movements**: Create inventory movement
  - Type can be IN, OUT, or ADJUSTMENT
  - ADMIN only
  - With and without optional reference
  - Insufficient stock validation for OUT/ADJUSTMENT (400)
  - USER forbidden (403)
  - Non-existent product (404)
  - Invalid quantity validation
  - Missing required fields
- **GET /api/inventory-movements/product/:productId**: Get inventory history
  - Both USER and ADMIN can view
  - Empty array for product with no movements
  - 404 for non-existent product
  - Authentication requirement
- **Stock Integration**: End-to-end stock calculation
  - Verifies stock updates correctly after multiple operations

##### `app.e2e-spec.ts`

Integration tests covering complete user journeys:

- **Complete User Journey**: Full workflow from registration to inventory management
  - Register → Login → Create Product → Upgrade to ADMIN → Add Inventory → View History
- **Multi-User Ownership**: Product ownership enforcement
  - Multiple users creating products
  - Cannot update/delete other users' products
  - Ownership validation across users
- **Role-Based Access Control**: RBAC enforcement
  - USER can view inventory but cannot modify
  - ADMIN has full inventory permissions
  - All inventory operations (IN/OUT/ADJUSTMENT) restricted to ADMIN

### Running Tests

#### Run all e2e tests:

```bash
npm run test:e2e
```

#### Run specific test file:

```bash
npm run test:e2e -- auth.e2e-spec.ts
npm run test:e2e -- products.e2e-spec.ts
npm run test:e2e -- inventory.e2e-spec.ts
npm run test:e2e -- app.e2e-spec.ts
```

#### Run with coverage:

```bash
npm run test:cov
```

#### Run in watch mode:

```bash
npm run test:watch
```

### Test Coverage

The test suite covers:

- **Authentication**: Registration, login, JWT tokens, role assignment
- **Authorization**: Role-based access control (USER vs ADMIN)
- **Validation**: DTO validation, data types, required fields
- **Ownership**: User-product ownership enforcement
- **Inventory**: Stock management (IN/OUT/ADJUSTMENT)
- **Error Handling**: 400, 401, 403, 404 responses
- **Integration**: Complete workflows and multi-user scenarios

### Test Structure

Each test file follows this structure:

1. **Setup**: Initialize NestJS app with global pipes and prefix
2. **BeforeEach**: Clean database and create test users/data
3. **Tests**: Organized by endpoint and functionality
4. **Assertions**: Verify responses, status codes, and data structure
5. **Cleanup**: Disconnect Prisma and close app

### Database Considerations

- Tests use the same database as development (consider setting up a separate test database)
- Each test cleans up data in `beforeEach` to ensure isolation
- Database is cleaned in this order to respect foreign key constraints:
  1. InventoryMovement
  2. Product
  3. User

### Best Practices Used

- Clear describe/it blocks with descriptive names
- Database cleanup between tests for isolation
- Consistent test structure across all test files
- Testing both success and error cases
- Verifying response structure and data integrity
- Testing edge cases (empty arrays, missing fields, invalid data)
- Authentication/authorization validation
- Integration tests for complete workflows
