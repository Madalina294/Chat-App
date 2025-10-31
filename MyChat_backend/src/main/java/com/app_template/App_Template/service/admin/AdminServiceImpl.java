package com.app_template.App_Template.service.admin;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.app_template.App_Template.entity.User;
import com.app_template.App_Template.dto.UserDto;
import com.app_template.App_Template.enums.Role;
import com.app_template.App_Template.repository.UserRepository;
import com.app_template.App_Template.service.auth.EmailService;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final EmailService emailService;
    
    @Override
    public List<UserDto> getAllUsers() {
        return this.userRepository.findAll()
                .stream()
                .filter(user -> user.getRole() != Role.ADMIN)
                .map(User::getUserDto)
                .collect(Collectors.toList());
    }

    @Override
    public Page<UserDto> getUsersPaginated(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
            Sort.by(sortBy).descending() : 
            Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        
        return this.userRepository.findByRoleNot(Role.ADMIN, pageable)
                .map(User::getUserDto);
    }

    @Override
    public void deleteUser(Long id) {
        Optional<User> user = this.userRepository.findById(id);
        if (user.isPresent()) {
            String username = user.get().getFirstname() + " " + user.get().getLastname();
            this.userRepository.delete(user.get());
            this.emailService.sendDeleteAccountEmail(user.get().getEmail(), username);
        }
        else throw new EntityNotFoundException("User not found");
    }

    @Override
    public void sendEmail(String toEmail, String subject, String body) {
        this.emailService.sendCustomEmail(toEmail, subject, body);
    }

    @Override
    public UserDto getUserById(Long userId) {
        Optional<User> user = this.userRepository.findById(userId);
        if (user.isPresent()) {
            return user.get().getUserDto();
        }
        else throw new EntityNotFoundException("User not found");
    }
}
