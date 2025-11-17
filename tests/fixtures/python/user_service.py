"""
User Service Module

Demonstrates Python features for CodeWeaver testing:
- Classes and inheritance
- Type hints (Python 3.5+)
- Decorators
- Static/class methods
- Async functions
- Private/protected methods
"""

from typing import List, Optional, Dict, Any
from dataclasses import dataclass
from abc import ABC, abstractmethod
import asyncio


@dataclass
class User:
    """User data class"""
    id: int
    username: str
    email: str
    age: int

    def is_adult(self) -> bool:
        """Check if user is adult"""
        return self.age >= 18


class UserService(ABC):
    """Abstract user service interface"""

    @abstractmethod
    async def get_user(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        pass

    @abstractmethod
    async def create_user(self, username: str, email: str, age: int) -> User:
        """Create new user"""
        pass


class DatabaseUserService(UserService):
    """Database-backed user service implementation"""

    def __init__(self, connection_string: str):
        """Initialize with database connection"""
        self._connection_string = connection_string
        self.__db_connection = None

    async def get_user(self, user_id: int) -> Optional[User]:
        """
        Get user by ID from database

        Args:
            user_id: User ID to fetch

        Returns:
            User object or None if not found
        """
        # Implementation would fetch from database
        return User(id=user_id, username="test", email="test@example.com", age=25)

    async def create_user(self, username: str, email: str, age: int) -> User:
        """Create new user in database"""
        # Implementation would insert into database
        return User(id=1, username=username, email=email, age=age)

    def _validate_email(self, email: str) -> bool:
        """
        Protected method: Validate email format

        Convention: Single underscore = protected
        """
        return "@" in email and "." in email

    def __connect_to_database(self) -> None:
        """
        Private method: Connect to database

        Convention: Double underscore = private (name mangling)
        """
        pass

    @staticmethod
    def hash_password(password: str) -> str:
        """Static method: Hash password"""
        return f"hashed_{password}"

    @classmethod
    def from_config(cls, config: Dict[str, Any]) -> "DatabaseUserService":
        """Class method: Create instance from config"""
        return cls(config["connection_string"])


def validate_username(func):
    """Decorator: Validate username before function execution"""
    def wrapper(*args, **kwargs):
        # Validation logic
        return func(*args, **kwargs)
    return wrapper


@validate_username
def create_user_account(username: str, email: str) -> User:
    """
    Module-level function with decorator

    Args:
        username: Username for new account
        email: Email for new account

    Returns:
        Created user object
    """
    return User(id=1, username=username, email=email, age=0)


async def async_fetch_users(user_ids: List[int]) -> List[User]:
    """
    Async module-level function

    Args:
        user_ids: List of user IDs to fetch

    Returns:
        List of user objects
    """
    await asyncio.sleep(0.1)
    return [User(id=uid, username=f"user_{uid}", email=f"user{uid}@example.com", age=20) for uid in user_ids]


# Module-level constants
MAX_USERNAME_LENGTH: int = 50
DEFAULT_USER_ROLE: str = "user"
