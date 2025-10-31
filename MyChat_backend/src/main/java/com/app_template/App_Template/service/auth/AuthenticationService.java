package com.app_template.App_Template.service.auth;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.app_template.App_Template.auth.AuthenticationRequest;
import com.app_template.App_Template.auth.AuthenticationResponse;
import com.app_template.App_Template.auth.ForgotPasswordResponse;
import com.app_template.App_Template.auth.RegisterRequest;
import com.app_template.App_Template.auth.ResetPasswordRequest;
import com.app_template.App_Template.auth.VerificationRequest;
import com.app_template.App_Template.config.JwtService;
import com.app_template.App_Template.entity.User;
import com.app_template.App_Template.enums.Role;
import com.app_template.App_Template.repository.UserRepository;
import com.app_template.App_Template.service.image.ImageService;
import com.app_template.App_Template.tfa.TwoFactorAuthenticationService;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthenticationService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final TwoFactorAuthenticationService tfaService;
    private final EmailService emailService;
    private final ImageService imageService;


    @PostConstruct
    public void createAdminAccount(){
        Optional<User> optionalAdmin = userRepository.findByRole(Role.ADMIN);
        if(optionalAdmin.isEmpty()){
            User admin = new User();
            admin.setFirstname("Admin");
            admin.setLastname("Management");
            admin.setEmail("admin@gmail.com");
            admin.setRole(Role.ADMIN);
            admin.setPassword(new BCryptPasswordEncoder().encode("Adminul_0"));
            admin.setMfaEnabled(true);
            admin.setPreferredTheme("dark");
            admin.setPreferredLanguage("en");
            admin.setSecret(tfaService.generateNewSecret());
            admin.setGoogleId(null); // Explicit set to null for admin
            userRepository.save(admin);
            System.out.println("Admin created successfully!");
        }
        else{
            // Update existing admin to ensure googleId is null
            User existingAdmin = optionalAdmin.get();
            if (existingAdmin.getGoogleId() == null) {
                existingAdmin.setGoogleId(null); // Explicitly set to null
                userRepository.save(existingAdmin);
                System.out.println("Admin updated with null googleId!");
            }
            System.out.println("Admin already exists!");
        }
    }


    public AuthenticationResponse register(RegisterRequest registerRequest) throws IOException {

        Optional<User> existingUser = userRepository.findFirstByEmail(registerRequest.getEmail());
        if (existingUser.isPresent()) {
            throw new IllegalArgumentException("Email already exists");
        }

        var user = User.builder()
                .firstname(registerRequest.getFirstname())
                .lastname(registerRequest.getLastname())
                .email(registerRequest.getEmail())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .role(registerRequest.getRole() != null ? registerRequest.getRole() : Role.USER)
                .imageUrl(null)
                .preferredTheme("dark")
                .preferredLanguage("en")
                .mfaEnabled(registerRequest.isMfaEnabled())
                .createdAt(LocalDateTime.now())
                .build();

        // if mfaEnabled --> generate secret

        if(registerRequest.isMfaEnabled()){
            user.setSecret(tfaService.generateNewSecret());
        }

        userRepository.save(user);
        emailService.sendWelcomeEmail(user.getEmail(), user.getFirstname() + " " + user.getLastname());

        var jwtToken  = jwtService.generateToken(user);
        var refreshToken = jwtService.generateRefreshToken(user);

        // Generează QR code-ul rapid dacă 2FA este activat
        String qrCodeUrl = null;
        if(user.isMfaEnabled() && user.getSecret() != null) {
            qrCodeUrl = tfaService.generateQrCodeImageUri(user.getSecret());
        }

        return AuthenticationResponse.builder()
                .userId(user.getId())
                .userFirstName(user.getFirstname())
                .userLastName(user.getLastname())
                .userRole(user.getRole())
                .image(user.getImageUrl())
                .preferredTheme(user.getPreferredTheme())
                .preferredLanguage(user.getPreferredLanguage())
                .googleId(user.getGoogleId() != null && !user.getGoogleId().isEmpty() ? user.getGoogleId() : null)
                .accessToken(jwtToken)
                .refreshToken(refreshToken)
                .mfaEnabled(user.isMfaEnabled())
                .qrCodeUrl(qrCodeUrl) // Include QR code-ul în răspuns - RAPID!
                .build();

    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow();

        
        if(user.isMfaEnabled()){
            // Generează QR code-ul rapid pentru login cu 2FA
            String qrCodeUrl = null;
            if(user.getSecret() != null) {
                qrCodeUrl = tfaService.generateQrCodeImageUri(user.getSecret());
            }

            return AuthenticationResponse.builder()
                    .userId(user.getId())
                    .userFirstName(user.getFirstname())
                    .userLastName(user.getLastname())
                    .userRole(user.getRole())
                    .image(user.getImageUrl())
                    .preferredTheme(user.getPreferredTheme())
                    .preferredLanguage(user.getPreferredLanguage())
                    .googleId(user.getGoogleId() != null && !user.getGoogleId().isEmpty() ? user.getGoogleId() : null)
                    .accessToken("")
                    .refreshToken("")
                    .mfaEnabled(true)
                    .qrCodeUrl(qrCodeUrl) // Include QR code-ul în răspuns - RAPID!
                    .build();
        }

        var jwtToken  = jwtService.generateToken(user);
        var refreshToken = jwtService.generateRefreshToken(user);

        System.out.println("Login - User: " + user.getEmail() + ", GoogleId: " + user.getGoogleId());
        return AuthenticationResponse.builder()
                .userId(user.getId())
                .userFirstName(user.getFirstname())
                .userLastName(user.getLastname())
                .userRole(user.getRole())
                .image(user.getImageUrl())
                .preferredTheme(user.getPreferredTheme())
                .preferredLanguage(user.getPreferredLanguage())
                .googleId(user.getGoogleId() != null && !user.getGoogleId().isEmpty() ? user.getGoogleId() : null)
                .accessToken(jwtToken)
                .refreshToken(refreshToken)
                .mfaEnabled(false)
                .build();
    }

    public void refreshToken(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {
        final String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        final String refreshToken;
        final String userEmail;
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return;
        }
        refreshToken = authHeader.substring(7);
        userEmail = jwtService.extractUsername(refreshToken);
        if (userEmail != null) {
            var user = this.userRepository.findByEmail(userEmail)
                    .orElseThrow();
            if (jwtService.isTokenValid(refreshToken, user)) {
                var accessToken = jwtService.generateToken(user);
                var authResponse = AuthenticationResponse.builder()
                        .accessToken(accessToken)
                        .refreshToken(refreshToken)
                        .mfaEnabled(false)
                        .build();
                new ObjectMapper().writeValue(response.getOutputStream(), authResponse);
            }
        }
    }

    public AuthenticationResponse verifyCode(VerificationRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new EntityNotFoundException(String.format("User with email %s not found", request.getEmail())));
        if(tfaService.isOtpNotValid(user.getSecret(), request.getCode())){
            throw new BadCredentialsException("Code is not correct");
        }
        var jwtToken = jwtService.generateToken(user);


        return AuthenticationResponse.builder()
                .userId(user.getId())
                .userFirstName(user.getFirstname())
                .userLastName(user.getLastname())
                .userRole(user.getRole())
                .image(user.getImageUrl())
                .preferredTheme(user.getPreferredTheme())
                .preferredLanguage(user.getPreferredLanguage())
                .googleId(user.getGoogleId() != null && !user.getGoogleId().isEmpty() ? user.getGoogleId() : null)
                .accessToken(jwtToken)
                .mfaEnabled(user.isMfaEnabled())
                .build();
    }


    // In AuthenticationService.java - Add better error handling
    public ForgotPasswordResponse forgotPassword(String userEmail) {
        try {
            // Validate email format first
            if (userEmail == null || userEmail.trim().isEmpty()) {
                throw new IllegalArgumentException("Email is required");
            }

            Optional<User> userOpt = userRepository.findByEmail(userEmail.trim().toLowerCase());

            if (userOpt.isEmpty()) {
                // Don't reveal if user exists or not for security
                return new ForgotPasswordResponse("If the email exists, a reset code has been sent", true);
            }

            User user = userOpt.get();

            // Generate 6-digit code
            String resetCode = String.format("%06d", new Random().nextInt(999999));

            // Set expiry time (15 minutes from now)
            user.setResetPasswordToken(passwordEncoder.encode(resetCode));
            user.setResetPasswordExpiry(LocalDateTime.now().plusMinutes(15));

            userRepository.save(user);

            // Try to send email
            try {
                emailService.sendResetPasswordEmail(user.getEmail(), resetCode);
                return new ForgotPasswordResponse("Reset code sent to your email", true);
            } catch (Exception emailException) {
                // Log the email error but don't expose it to client
                System.err.println("Failed to send email: " + emailException.getMessage());
                emailException.printStackTrace();

                // Clean up the reset token since email failed
                user.setResetPasswordToken(null);
                user.setResetPasswordExpiry(null);
                userRepository.save(user);

                throw new RuntimeException("Failed to send reset email. Please try again later.");
            }

        } catch (Exception e) {
            System.err.println("Forgot password error: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    public AuthenticationResponse resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        // Check if token exists and hasn't expired
        if (user.getResetPasswordToken() == null ||
                user.getResetPasswordExpiry().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Reset code has expired or is invalid");
        }

        // Verify reset code
        if (!passwordEncoder.matches(request.getResetCode(), user.getResetPasswordToken())) {
            throw new IllegalArgumentException("Invalid reset code");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetPasswordToken(null);
        user.setResetPasswordExpiry(null);

        userRepository.save(user);

        // Generate new JWT token
        var jwtToken = jwtService.generateToken(user);

        return AuthenticationResponse.builder()
                .userId(user.getId())
                .userFirstName(user.getFirstname())
                .userLastName(user.getLastname())
                .userRole(user.getRole())
                .accessToken(jwtToken)
                .mfaEnabled(user.isMfaEnabled())
                .build();
    }


}
