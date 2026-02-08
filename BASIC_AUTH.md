# **Basic Auth Implementation with NestJS + Bcrypt + JWT**

---

## **Background**

### Context

This document outlines the complete setup and implementation of basic authentication in a NestJS application using PostgreSQL (Supabase), Bcrypt for password hashing, and JWT for token-based authentication.

### Objectives

- Secure user registration with hashed passwords
- Implement JWT-based login mechanism
- Protect routes with authentication guards
- Provide reusable auth patterns for future development

### Scope

- User registration and login endpoints
- Password hashing and validation
- JWT token generation and validation
- Protected routes with JwtAuthGuard
- Database integration with Prisma ORM
- Integration with Supabase PostgreSQL

---

## **Analysis**

### Current Architecture

- **Framework**: NestJS 11
- **Database**: PostgreSQL (Supabase with pooler + direct connections)
- **Authentication**: Passport.js + JWT Strategy
- **Password Security**: Bcrypt with salt generation
- **ORM**: Prisma 7 with PrismaPg adapter

### Key Findings

#### **1. Connection Management**

```
DATABASE_URL (Pooler)     → For application queries (port 6543)
DIRECT_URL (Direct)       → For migrations & seeding (port 5432)
PrismaService constructor → Uses DIRECT_URL for runtime
```

**Why**: PgBouncer connection pooling can cause `prepared statement` conflicts; direct connections more stable for application runtime.

#### **2. Environment Variable Loading**

**Critical Issue**: `.env` only loads in Prisma CLI without `import 'dotenv/config'` in `main.ts`

```typescript
// Without this, process.env is undefined at runtime
import 'dotenv/config'; // ← MUST be first import
```

#### **3. Password Security Flow**

```
Register:
  Plain Password → Bcrypt Hash → Store in DB

Login:
  Plain Password + DB Hash → Bcrypt Compare → Boolean Result
```

#### **4. JWT Token Lifecycle**

```
Login Success → Generate JWT with user data (sub, username, email)
              → Return accessToken to client

Protected Request → Client sends: Authorization: Bearer <token>
                 → JwtStrategy validates signature
                 → Extract user data from payload
                 → Allow access to protected route
```

### Challenges & Solutions

| Challenge                    | Solution                                                       |
| ---------------------------- | -------------------------------------------------------------- |
| `ECONNREFUSED` errors        | Use DIRECT_URL + load dotenv in main.ts                        |
| Prepared statement conflicts | Use direct connection for application, pooler for queries only |
| Auth across modules          | Export PrismaService from PrismaModule                         |
| Route protection             | Create JwtAuthGuard and apply with @UseGuards                  |

---

## **Recommendations**

### **1. Dependency Installation Priority**

```bash
# Install in this order:
npm install bcrypt @nestjs/jwt @nestjs/passport passport passport-jwt pg
npm install -D @types/bcrypt @types/passport-jwt
```

### **2. Configuration Best Practices**

**Environment Setup:**

```env
# .env
DATABASE_URL="postgresql://user:pass@pooler.supabase.com:6543/db?pgbouncer=true"
DIRECT_URL="postgresql://user:pass@direct.supabase.com:5432/db"
JWT_SECRET="long-random-string-min-32-chars"
JWT_EXPIRY="1h"
```

**Why separate URLs:**

- Pooler is faster for many small queries
- Direct connection needed for schema changes
- Application should prefer stable connections

### **3. Security Recommendations**

```typescript
// DO:
✅ Hash passwords with bcrypt.hash(password, salt)
✅ Use process.env.DIRECT_URL in PrismaService
✅ Load dotenv in main.ts before everything
✅ Set JWT_EXPIRY to reasonable duration (1h-24h)
✅ Use @UseGuards(JwtAuthGuard) on protected routes

// DON'T:
❌ Store plain passwords
❌ Use DATABASE_URL (pooler) in PrismaService constructor
❌ Skip dotenv import in main.ts
❌ Set JWT_EXPIRY to months/years
❌ Expose JWT_SECRET in code
```

### **4. Module Organization**

```
src/
├── prisma/
│   ├── prisma.module.ts      (exports PrismaService)
│   └── prisma.service.ts     (database connection)
├── auth/
│   ├── strategies/
│   │   └── jwt/
│   │       └── jwt.ts        (JWT validation)
│   ├── guards/
│   │   └── jwt.guard.ts      (route protection)
│   ├── auth.controller.ts    (register, login, me endpoints)
│   ├── auth.service.ts       (business logic)
│   └── auth.module.ts        (imports PrismaModule)
└── main.ts                   (import 'dotenv/config' FIRST!)
```

---

## **Implementation**

### **Phase 1: Foundation Setup** (Day 1)

#### **1.1 Install Dependencies**

```bash
npm install bcrypt @nestjs/jwt @nestjs/passport passport passport-jwt pg
npm install -D @types/bcrypt @types/passport-jwt
```

**Time**: 2 minutes  
**Verification**: `npm list bcrypt @nestjs/jwt`

#### **1.2 Update .env**

```env
DATABASE_URL="postgresql://postgres.xxx:pass@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxx:pass@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
JWT_SECRET="your-secret-key-min-32-chars-long"
```

**Time**: 5 minutes  
**Verification**: Check if values match Supabase console

#### **1.3 Update Prisma Schema**

```prisma
// prisma/schema.prisma
model User {
  id        String   @id @default(uuid())
  username  String   @unique
  email     String   @unique
  password  String
  role      Role     @default(USER)
  createdAt DateTime @default(now())
}
```

**Time**: 5 minutes  
**Verification**: `npx prisma validate`

---

### **Phase 2: Database Layer** (Day 1)

#### **2.1 Update Prisma Config**

```typescript
// prisma.config.ts
datasource: {
  url: process.env['DIRECT_URL'] || process.env['DATABASE_URL'],
},
```

**Time**: 3 minutes

#### **2.2 Create Prisma Service**

```typescript
// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const pool = new Pool({
      connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
```

**Time**: 5 minutes  
**Verification**: Service builds without errors

#### **2.3 Create Prisma Module**

```typescript
// src/prisma/prisma.module.ts
import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

**Time**: 2 minutes

#### **2.4 Run Migration**

```bash
npx prisma migrate dev --name init
```

**Time**: 30-60 seconds (depends on network to Supabase)  
**Verification**: Check `prisma/migrations/` folder created

---

### **Phase 3: Authentication Core** (Day 2)

#### **3.1 Create Auth Service**

```typescript
// src/auth/auth.service.ts
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }

  async comparePasswords(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async register(
    username: string,
    email: string,
    password: string,
  ): Promise<any> {
    const userExists = await this.prisma.user.findUnique({
      where: { email },
    });

    if (userExists) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await this.hashPassword(password);
    const user = await this.prisma.user.create({
      data: { email, username, password: hashedPassword },
    });

    return { id: user.id, email: user.email, username: user.username };
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ accessToken: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.comparePasswords(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({
      sub: user.id,
      username: user.username,
      email: user.email,
    });

    return { accessToken: token };
  }
}
```

**Time**: 20 minutes  
**Verification**: Service methods compile, types correct

#### **3.2 Create JWT Strategy**

```typescript
// src/auth/strategies/jwt/jwt.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: { sub: string; username: string; email: string }) {
    return {
      userId: payload.sub,
      username: payload.username,
      email: payload.email,
    };
  }
}
```

**Time**: 10 minutes

#### **3.3 Create JWT Guard**

```typescript
// src/auth/guards/jwt.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

**Time**: 3 minutes

---

### **Phase 4: Routes & Controllers** (Day 2)

#### **4.1 Create Auth Controller**

```typescript
// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(
    @Body() body: { username: string; email: string; password: string },
  ) {
    return this.authService.register(body.username, body.email, body.password);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    return req.user;
  }
}
```

**Time**: 15 minutes

#### **4.2 Create Auth Module**

```typescript
// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtStrategy } from './strategies/jwt/jwt';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
```

**Time**: 10 minutes

#### **4.3 Update App Module**

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

**Time**: 5 minutes

---

### **Phase 5: Runtime Configuration** (Day 2)

#### **5.1 Update main.ts**

```typescript
// src/main.ts
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  await app.listen(3000);
}
bootstrap();
```

**Time**: 2 minutes  
**Verification**: Run `npm run start:dev` - should connect to DB

#### **5.2 Database Seeding (Optional)**

```bash
npx prisma db seed
```

**Time**: 30 seconds  
**Result**: 2 test users in database

---

### **Phase 6: Testing** (Day 3)

#### **6.1 Test Registration**

```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}

Expected: 201 Created
{
  "id": "uuid",
  "email": "test@example.com",
  "username": "testuser"
}
```

**Time**: 5 minutes

#### **6.2 Test Login**

```bash
POST http://localhost:3000/api/auth/login
{
  "email": "test@example.com",
  "password": "password123"
}

Expected: 200 OK
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Time**: 5 minutes

#### **6.3 Test Protected Route**

```bash
GET http://localhost:3000/api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

Expected: 200 OK
{
  "userId": "uuid",
  "username": "testuser",
  "email": "test@example.com"
}
```

**Time**: 5 minutes

---

### **Timeline Summary**

| Phase | Task                                 | Duration | Total          |
| ----- | ------------------------------------ | -------- | -------------- |
| 1     | Setup dependencies & config          | 15 min   | 15 min         |
| 2     | Database layer (Prisma)              | 45 min   | 1 hour         |
| 3     | Auth core (Service, Strategy, Guard) | 30 min   | 1.5 hours      |
| 4     | Routes & Controllers                 | 30 min   | 2 hours        |
| 5     | Runtime config                       | 2 min    | 2 hours        |
| 6     | Testing & verification               | 15 min   | **2.25 hours** |

**Total Implementation Time**: ~2.5 hours

---

### **Resource Requirements**

**Developer**

- 1 backend developer
- Experience with: TypeScript, NestJS, PostgreSQL
- Familiarity with: JWT, Bcrypt concepts

**Infrastructure**

- Supabase PostgreSQL database (free tier ok)
- Node.js 20+
- npm 10+

**Tools**

- Postman or Thunder Client (for API testing)
- VS Code with NestJS extensions
- Terminal/PowerShell

---

### **Success Criteria**

✅ Register endpoint creates users with hashed passwords  
✅ Login endpoint returns valid JWT token  
✅ Protected routes reject requests without token  
✅ Protected routes accept valid JWT tokens  
✅ Token contains correct user data (sub, username, email)  
✅ Invalid credentials return 401 Unauthorized  
✅ Database connection uses DIRECT_URL without `ECONNREFUSED` errors

---

### **Next Steps (Post-Implementation)**

1. **Add email verification** - Send confirmation email on register
2. **Refresh token rotation** - Implement refresh token flow
3. **Role-based access control** - Add @Roles() decorator for ADMIN checks
4. **Password reset** - Implement forgot password endpoint
5. **Rate limiting** - Prevent brute force attacks on login
6. **Logging & monitoring** - Track auth events for security audit

---

**Document Version**: 1.0  
**Last Updated**: January 30, 2026  
**Status**: Ready for Implementation
