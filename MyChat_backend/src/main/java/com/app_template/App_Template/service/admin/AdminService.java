package com.app_template.App_Template.service.admin;

import java.util.List;

import org.springframework.data.domain.Page;

import com.app_template.App_Template.dto.UserDto;

public interface AdminService {

    public List<UserDto> getAllUsers();
    public Page<UserDto> getUsersPaginated(int page, int size, String sortBy, String sortDir);
    public void deleteUser(Long id);
    public void sendEmail(String toEmail, String subject, String body);
    public UserDto getUserById(Long userId);
}
