package com.app_template.App_Template.service.user;

import java.io.IOException;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.app_template.App_Template.auth.UpdateInfosRequest;
import com.app_template.App_Template.auth.UpdatePasswordRequest;
import com.app_template.App_Template.entity.User;
import com.app_template.App_Template.dto.UserDto;
import com.app_template.App_Template.repository.UserRepository;
import com.app_template.App_Template.service.image.ImageService;
import com.app_template.App_Template.tfa.TwoFactorAuthenticationService;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TwoFactorAuthenticationService tfaService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ImageService imageService;

    @Override
    public void deleteAccount(Long userId) {
        Optional<User> user = userRepository.findFirstById(userId);
        if (user.isPresent()) {
            // Șterge imaginea utilizatorului înainte de a șterge contul
            try {
                imageService.deleteUserImage(userId);
            } catch (IOException e) {
                // Log eroarea dar continuă cu ștergerea contului
                System.err.println("Failed to delete user image: " + e.getMessage());
            }
            userRepository.deleteById(userId);
        }
        else{
            throw new EntityNotFoundException("User not found");
        }
    }



    @Override
    public UserDto updateProfileInfos(UpdateInfosRequest request) throws IOException {
        User presentUser = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("User not found"));


        // Update email
        if(!presentUser.getEmail().equals(request.getEmail())) {
            Optional<User> existingUser = userRepository.findFirstByEmail(request.getEmail());
            if (existingUser.isPresent()) {
                throw new IllegalArgumentException("Email already exists");
            }
            presentUser.setEmail(request.getEmail());
        }

        // Update username
        presentUser.setFirstname(request.getFirstName());
        presentUser.setLastname(request.getLastName());

        // Update 2fa feature
        if(request.isMfaEnabled()){
            presentUser.setMfaEnabled(true);
            presentUser.setSecret(tfaService.generateNewSecret());
        }
        // Deactivate 2fa feature
        if(presentUser.isMfaEnabled() && !request.isMfaEnabled()){
            presentUser.setMfaEnabled(false);
            presentUser.setSecret(null);
        }

        //update image
        if(request.getImage() != null && !request.getImage().isEmpty()){
            String imageUrl = imageService.saveUserImage(presentUser.getId(), request.getImage());
            presentUser.setImageUrl(imageUrl);
        }

        User user = userRepository.save(presentUser);
        
        return user.getUserDto();
    }

    @Override
    public UserDto updatePassword(UpdatePasswordRequest request) {
        Optional<User> presentUser = userRepository.findFirstById(request.getUserId());
        if (presentUser.isPresent()) {
            User user = presentUser.get();

            // Verify current password matches
            if(request.getCurrentPassword() != null && 
               passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())){
                // Encode new password with BCrypt (same as registration/login)
                user.setPassword(passwordEncoder.encode(request.getNewPassword()));
            } else {
                throw new IllegalArgumentException("Current password is incorrect");
            }

            return (userRepository.save(user)).getUserDto();
        }
        throw new EntityNotFoundException("User not found");
    }

    @Override
    public UserDto updatePreferredTheme(Long userId, String theme) {
        Optional<User> presentUser = userRepository.findFirstById(userId);
        if (presentUser.isPresent()) {
            User user = presentUser.get();
            user.setPreferredTheme(theme);
            return (userRepository.save(user)).getUserDto();
        }
        throw new EntityNotFoundException("User not found");
    }

    @Override
    public UserDto updatePreferredLanguage(Long userId, String language) {
        Optional<User> presentUser = userRepository.findFirstById(userId);
        if (presentUser.isPresent()) {
            User user = presentUser.get();
            user.setPreferredLanguage(language);
            return (userRepository.save(user)).getUserDto();
        }
        throw new EntityNotFoundException("User not found");
    }

}
