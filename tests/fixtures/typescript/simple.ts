/**
 * Simple TypeScript test fixture
 * Tests basic TypeScript features: classes, interfaces, types, enums, functions
 */

// Interface
export interface User {
  id: number;
  name: string;
  email?: string;
}

// Type alias
export type UserId = number | string;

// Enum
export enum Status {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
  Pending = 'PENDING',
}

// Class with properties and methods
export class UserService {
  private users: User[] = [];

  constructor(private readonly apiUrl: string) {}

  async getUser(id: UserId): Promise<User | null> {
    // Implementation
    return null;
  }

  static validateEmail(email: string): boolean {
    return email.includes('@');
  }
}

// Function
export function formatUser(user: User): string {
  return `${user.name} (${user.id})`;
}

// Arrow function (const)
export const isAdult = (age: number): boolean => age >= 18;

// Async function
export async function fetchUsers(): Promise<User[]> {
  return [];
}
