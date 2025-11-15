package com.example.modern;

import java.util.List;
import java.util.Optional;

/**
 * Test file for modern Java features (Java 14+)
 */
@Entity
@Table(name = "users")
public class ModernJavaFeatures {

    // === 1. RECORDS (Java 14+) ===
    public record UserDTO(
        @NotNull String username,
        String email,
        int age
    ) {
        // Compact constructor
        public UserDTO {
            if (age < 0) throw new IllegalArgumentException("Age must be positive");
        }

        // Additional method
        public boolean isAdult() {
            return age >= 18;
        }
    }

    // Nested record
    public record Address(String street, String city, String zipCode) {
        // Empty body
    }

    // === 2. SEALED CLASSES (Java 17+) ===
    public sealed interface Shape permits Circle, Rectangle, Triangle {}

    public final class Circle implements Shape {
        private final double radius;
        public Circle(double radius) { this.radius = radius; }
    }

    public final class Rectangle implements Shape {
        private final double width, height;
        public Rectangle(double width, double height) {
            this.width = width;
            this.height = height;
        }
    }

    public non-sealed class Triangle implements Shape {
        private double base, height;
    }

    // === 3. PATTERN MATCHING (Java 16+) ===
    public String formatShape(Shape shape) {
        return switch (shape) {
            case Circle c -> "Circle with radius " + c.radius;
            case Rectangle r -> "Rectangle " + r.width + "x" + r.height;
            case Triangle t -> "Triangle";
            default -> "Unknown shape";
        };
    }

    // === 4. TEXT BLOCKS (Java 15+) ===
    private static final String JSON_TEMPLATE = """
        {
            "name": "%s",
            "email": "%s",
            "age": %d
        }
        """;

    // === 5. ANNOTATIONS ===
    @Override
    @Deprecated(since = "2.0", forRemoval = true)
    @SuppressWarnings({"unchecked", "rawtypes"})
    public String toString() {
        return "ModernJavaFeatures";
    }

    @Autowired
    @Qualifier("primaryDataSource")
    private DataSource dataSource;

    @GetMapping("/users/{id}")
    @ResponseBody
    public UserDTO getUser(@PathVariable Long id) {
        return new UserDTO("john", "john@example.com", 25);
    }

    // === 6. ENUM with methods ===
    public enum Status {
        ACTIVE("Active", 1),
        INACTIVE("Inactive", 0),
        PENDING("Pending", 2);

        private final String displayName;
        private final int code;

        Status(String displayName, int code) {
            this.displayName = displayName;
            this.code = code;
        }

        public String getDisplayName() { return displayName; }
        public int getCode() { return code; }

        public boolean isActive() {
            return this == ACTIVE;
        }
    }

    // === 7. GENERIC METHODS ===
    public <T extends Comparable<T>> T findMax(List<T> items) {
        return items.stream().max(T::compareTo).orElse(null);
    }

    // === 8. VAR (Java 10+) ===
    public void useVar() {
        var name = "John";  // String
        var age = 25;       // int
        var list = List.of(1, 2, 3);  // List<Integer>
    }

    // === 9. STATIC NESTED CLASS ===
    public static class Builder {
        private String name;
        private int age;

        public Builder withName(String name) {
            this.name = name;
            return this;
        }

        public Builder withAge(int age) {
            this.age = age;
            return this;
        }

        public ModernJavaFeatures build() {
            return new ModernJavaFeatures();
        }
    }

    // === 10. INNER CLASS ===
    public class Inner {
        public void doSomething() {
            System.out.println("Inner class method");
        }
    }

    // === 11. ANONYMOUS CLASS ===
    public Runnable createRunnable() {
        return new Runnable() {
            @Override
            public void run() {
                System.out.println("Anonymous class");
            }
        };
    }

    // === 12. LAMBDA & METHOD REFERENCES ===
    public void useLambdas() {
        List<String> names = List.of("Alice", "Bob", "Charlie");

        // Lambda
        names.forEach(name -> System.out.println(name));

        // Method reference
        names.forEach(System.out::println);
    }
}
