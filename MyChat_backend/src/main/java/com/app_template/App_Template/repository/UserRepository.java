package com.app_template.App_Template.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.app_template.App_Template.entity.User;
import com.app_template.App_Template.enums.Role;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByRole(Role role);
    Optional<User> findFirstByEmail(String email);

    Optional<User> findFirstById(Long userId);

    Optional<User> findByEmail(String email);
    
    Page<User> findByRoleNot(Role role, Pageable pageable);
}
