import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 400, description: 'HTTP status code' })
  statusCode: number;

  @ApiProperty({
    example: 'Bad Request',
    description: 'Error message or array of validation errors',
  })
  message: string | string[];

  @ApiProperty({ example: 'Bad Request', description: 'Error type' })
  error: string;
}

export class UnauthorizedResponseDto {
  @ApiProperty({ example: 401, description: 'HTTP status code' })
  statusCode: number;

  @ApiProperty({ example: 'Unauthorized', description: 'Error message' })
  message: string;
}

export class ForbiddenResponseDto {
  @ApiProperty({ example: 403, description: 'HTTP status code' })
  statusCode: number;

  @ApiProperty({
    example: 'Forbidden - Requires ADMIN role',
    description: 'Error message',
  })
  message: string;
}

export class NotFoundResponseDto {
  @ApiProperty({ example: 404, description: 'HTTP status code' })
  statusCode: number;

  @ApiProperty({ example: 'Product not found', description: 'Error message' })
  message: string;

  @ApiProperty({ example: 'Not Found', description: 'Error type' })
  error: string;
}
