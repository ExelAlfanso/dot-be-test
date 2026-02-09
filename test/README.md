# End-to-End Testing

This directory contains comprehensive e2e tests for the NestJS Inventory Management System.

## Test Files

### `auth.e2e-spec.ts`

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
- **GET /api/auth/me**: User profile retrieval
  - USER role profile
  - ADMIN role profile
  - Missing token handling
  - Invalid token handling
  - Malformed authorization header

### `products.e2e-spec.ts`

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

### `inventory.e2e-spec.ts`

Tests inventory management functionality:

- **POST /api/inventory/in**: Add inventory stock
  - ADMIN can add inventory
  - With and without optional reference
  - USER forbidden (403)
  - Non-existent product (404)
  - Invalid quantity validation
  - Missing required fields
- **POST /api/inventory/out**: Remove inventory stock
  - ADMIN can remove inventory
  - Insufficient stock validation (400)
  - USER forbidden (403)
  - Authentication requirement
- **POST /api/inventory/adjustment**: Adjust inventory
  - ADMIN can adjust inventory
  - Required reason field validation
  - USER forbidden (403)
  - Authentication requirement
- **GET /api/inventory/product/:productId**: Get inventory history
  - Both USER and ADMIN can view
  - Empty array for product with no movements
  - 404 for non-existent product
  - Authentication requirement
- **Stock Integration**: End-to-end stock calculation
  - Verifies stock updates correctly after multiple operations

### `app.e2e-spec.ts`

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

## Running Tests

### Run all e2e tests:

```bash
npm run test:e2e
```

### Run specific test file:

```bash
npm run test:e2e -- auth.e2e-spec.ts
npm run test:e2e -- products.e2e-spec.ts
npm run test:e2e -- inventory.e2e-spec.ts
npm run test:e2e -- app.e2e-spec.ts
```

### Run with coverage:

```bash
npm run test:cov
```

### Run in watch mode:

```bash
npm run test:watch
```

## Test Coverage

The test suite covers:

- ✅ **Authentication**: Registration, login, JWT tokens, role assignment
- ✅ **Authorization**: Role-based access control (USER vs ADMIN)
- ✅ **Validation**: DTO validation, data types, required fields
- ✅ **Ownership**: User-product ownership enforcement
- ✅ **Inventory**: Stock management (IN/OUT/ADJUSTMENT)
- ✅ **Error Handling**: 400, 401, 403, 404 responses
- ✅ **Integration**: Complete workflows and multi-user scenarios

## Test Structure

Each test file follows this structure:

1. **Setup**: Initialize NestJS app with global pipes and prefix
2. **BeforeEach**: Clean database and create test users/data
3. **Tests**: Organized by endpoint and functionality
4. **Assertions**: Verify responses, status codes, and data structure
5. **Cleanup**: Disconnect Prisma and close app

## Database Considerations

- Tests use the same database as development (consider setting up a separate test database)
- Each test cleans up data in `beforeEach` to ensure isolation
- Database is cleaned in this order to respect foreign key constraints:
  1. InventoryMovement
  2. Product
  3. User

## Best Practices Used

- ✅ Clear describe/it blocks with descriptive names
- ✅ Database cleanup between tests for isolation
- ✅ Consistent test structure across all test files
- ✅ Testing both success and error cases
- ✅ Verifying response structure and data integrity
- ✅ Testing edge cases (empty arrays, missing fields, invalid data)
- ✅ Authentication/authorization validation
- ✅ Integration tests for complete workflows

## Notes

- Tests require a running PostgreSQL database (Supabase)
- Environment variables must be set (DATABASE_URL, JWT_SECRET)
- bcrypt is used for password hashing in test setup
- All tests use the `/api` prefix as configured in main.ts
