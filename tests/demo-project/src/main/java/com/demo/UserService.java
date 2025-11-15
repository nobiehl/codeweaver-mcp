package com.demo;

import java.util.List;

public interface UserService {
    User findById(String id);
    List<User> findAll();
    void save(User user);
    void delete(String id);
    boolean exists(String id);
}
