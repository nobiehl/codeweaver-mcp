/**
 * Complex TypeScript test fixture
 * Tests advanced features: generics, decorators, abstract classes, JSX
 */

// Generic interface
export interface Repository<T> {
  findById(id: number): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<T>;
}

// Abstract class with generics
export abstract class BaseService<T> {
  protected abstract repository: Repository<T>;

  async getById(id: number): Promise<T | null> {
    return this.repository.findById(id);
  }

  abstract validate(entity: T): boolean;
}

// Decorator (simplified - no actual implementation)
function Component(target: any) {
  return target;
}

function Injectable() {
  return function (target: any) {
    return target;
  };
}

// Class with decorators
@Component
export class TodoComponent {
  @Injectable()
  private service!: TodoService;

  private items: Todo[] = [];

  render() {
    return <div>{this.items.map(item => item.title)}</div>;
  }
}

// Interface for Todo
interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

// Service class
export class TodoService extends BaseService<Todo> {
  protected repository: Repository<Todo>;

  constructor(repo: Repository<Todo>) {
    super();
    this.repository = repo;
  }

  validate(todo: Todo): boolean {
    return todo.title.length > 0;
  }

  async toggle(id: number): Promise<void> {
    const todo = await this.getById(id);
    if (todo) {
      todo.completed = !todo.completed;
      await this.repository.save(todo);
    }
  }
}

// Generic utility function
export function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

// Union type with type guard
export type Result<T> = { success: true; data: T } | { success: false; error: string };

export function isSuccess<T>(result: Result<T>): result is { success: true; data: T } {
  return result.success;
}
