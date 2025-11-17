"""Simple Python module for basic testing"""


class Calculator:
    """Simple calculator class"""

    def add(self, a: int, b: int) -> int:
        """Add two numbers"""
        return a + b

    def subtract(self, a: int, b: int) -> int:
        """Subtract two numbers"""
        return a - b


def greet(name: str) -> str:
    """Greet a person"""
    return f"Hello, {name}!"
