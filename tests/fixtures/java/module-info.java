module com.example.myapp {
    requires java.base;
    requires transitive java.sql;
    requires static lombok;

    exports com.example.myapp.api;
    exports com.example.myapp.model to com.example.client;

    opens com.example.myapp.internal to spring.core, spring.beans;

    uses com.example.myapp.spi.ServiceProvider;

    provides com.example.myapp.spi.ServiceProvider
        with com.example.myapp.impl.ServiceProviderImpl;
}
