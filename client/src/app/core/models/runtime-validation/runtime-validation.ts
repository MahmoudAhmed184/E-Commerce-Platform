import type { PaginatedResponse } from '../pagination/pagination.model';

export class ResponseValidationError extends Error {
  constructor(context: string, detail: string) {
    super(`Invalid ${context} response: ${detail}.`);
    this.name = 'ResponseValidationError';
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function parseRecord(value: unknown, context: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new ResponseValidationError(context, 'expected an object');
  }

  return value;
}

export function parseString(value: unknown, context: string): string {
  if (typeof value !== 'string') {
    throw new ResponseValidationError(context, 'expected a string');
  }

  return value;
}

export function parseNumber(value: unknown, context: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ResponseValidationError(context, 'expected a finite number');
  }

  return value;
}

export function parseBoolean(value: unknown, context: string): boolean {
  if (typeof value !== 'boolean') {
    throw new ResponseValidationError(context, 'expected a boolean');
  }

  return value;
}

export function parseNullableString(value: unknown, context: string): string | null {
  if (value === null) {
    return null;
  }

  return parseString(value, context);
}

export function parseOptionalString(value: unknown, context: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return parseString(value, context);
}

export function parseOptionalNullableString(value: unknown, context: string): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  return parseNullableString(value, context);
}

export function parseLiteral<TValue extends string>(
  value: unknown,
  allowedValues: readonly TValue[],
  context: string,
): TValue {
  const stringValue = parseString(value, context);

  if (!isAllowedLiteral(stringValue, allowedValues)) {
    throw new ResponseValidationError(context, `expected one of ${allowedValues.join(', ')}`);
  }

  return stringValue;
}

function isAllowedLiteral<TValue extends string>(value: string, allowedValues: readonly TValue[]): value is TValue {
  return allowedValues.some((allowedValue) => allowedValue === value);
}

export function parseStringField(record: Record<string, unknown>, key: string, context: string): string {
  return parseString(record[key], `${context}.${key}`);
}

export function parseNumberField(record: Record<string, unknown>, key: string, context: string): number {
  return parseNumber(record[key], `${context}.${key}`);
}

export function parseBooleanField(record: Record<string, unknown>, key: string, context: string): boolean {
  return parseBoolean(record[key], `${context}.${key}`);
}

export function parseNullableStringField(record: Record<string, unknown>, key: string, context: string): string | null {
  return parseNullableString(record[key], `${context}.${key}`);
}

export function parseOptionalStringField(record: Record<string, unknown>, key: string, context: string): string | undefined {
  return parseOptionalString(record[key], `${context}.${key}`);
}

export function parseOptionalNullableStringField(
  record: Record<string, unknown>,
  key: string,
  context: string,
): string | null | undefined {
  return parseOptionalNullableString(record[key], `${context}.${key}`);
}

export function parseLiteralField<TValue extends string>(
  record: Record<string, unknown>,
  key: string,
  allowedValues: readonly TValue[],
  context: string,
): TValue {
  return parseLiteral(record[key], allowedValues, `${context}.${key}`);
}

export function parseRecordField(record: Record<string, unknown>, key: string, context: string): Record<string, unknown> {
  return parseRecord(record[key], `${context}.${key}`);
}

export function parseArray<TValue>(
  value: unknown,
  itemParser: (item: unknown, index: number) => TValue,
  context: string,
): TValue[] {
  if (!Array.isArray(value)) {
    throw new ResponseValidationError(context, 'expected an array');
  }

  return value.map((item, index) => itemParser(item, index));
}

export function parseArrayField<TValue>(
  record: Record<string, unknown>,
  key: string,
  itemParser: (item: unknown, index: number) => TValue,
  context: string,
): TValue[] {
  return parseArray(record[key], itemParser, `${context}.${key}`);
}

export function parseOptionalArrayField<TValue>(
  record: Record<string, unknown>,
  key: string,
  itemParser: (item: unknown, index: number) => TValue,
  context: string,
): TValue[] | undefined {
  const value = record[key];

  if (value === undefined || value === null) {
    return undefined;
  }

  return parseArray(value, itemParser, `${context}.${key}`);
}

export function parsePaginatedResponse<TValue>(
  value: unknown,
  itemParser: (item: unknown, index: number) => TValue,
  context: string,
): PaginatedResponse<TValue> {
  const record = parseRecord(value, context);

  return {
    count: parseNumberField(record, 'count', context),
    next: parseNullableStringField(record, 'next', context),
    previous: parseNullableStringField(record, 'previous', context),
    results: parseArrayField(record, 'results', itemParser, context),
  };
}
