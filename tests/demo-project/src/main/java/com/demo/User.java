package com.demo;

public class User {
    private String id;
    private String name;
    private String email;
    private Status status;

    public User(String id, String name) {
        this.id = id;
        this.name = name;
        this.status = Status.ACTIVE;
    }

    public String getId() {
        return id;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public Status getStatus() {
        return status;
    }
}
