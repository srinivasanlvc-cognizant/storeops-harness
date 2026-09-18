import { AppError, ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../src/shared/errors';

describe('AppError hierarchy', () => {
  it.each([
    [new ValidationError('bad input'), 'VALIDATION_ERROR', 400],
    [new NotFoundError('missing'), 'NOT_FOUND', 404],
    [new ConflictError('dupe'), 'CONFLICT', 409],
    [new ForbiddenError('nope'), 'FORBIDDEN', 403],
  ])('exposes the correct code and statusCode', (error, code, statusCode) => {
    expect(error).toBeInstanceOf(AppError);
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe(code);
    expect(error.statusCode).toBe(statusCode);
  });

  it('serializes to a plain code/message object', () => {
    const error = new ValidationError('bad input');
    expect(error.toJSON()).toEqual({ code: 'VALIDATION_ERROR', message: 'bad input' });
  });
});
