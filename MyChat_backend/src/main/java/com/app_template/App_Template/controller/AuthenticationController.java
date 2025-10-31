package com.app_template.App_Template.controller;

import java.io.IOException;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.app_template.App_Template.auth.AuthenticationRequest;
import com.app_template.App_Template.auth.AuthenticationResponse;
import com.app_template.App_Template.auth.ForgotPasswordRequest;
import com.app_template.App_Template.auth.ForgotPasswordResponse;
import com.app_template.App_Template.auth.RegisterRequest;
import com.app_template.App_Template.auth.ResetPasswordRequest;
import com.app_template.App_Template.auth.VerificationRequest;
import com.app_template.App_Template.repository.UserRepository;
import com.app_template.App_Template.service.auth.AuthenticationService;
import com.app_template.App_Template.service.auth.EmailService;
import com.app_template.App_Template.tfa.TwoFactorAuthenticationService;

import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/auth")

public class AuthenticationController {

    private final AuthenticationService authenticationService;
    private final EmailService emailService;
    private final UserRepository userRepository;
    private final TwoFactorAuthenticationService tfaService;

    @PostMapping("/register")
    public ResponseEntity<AuthenticationResponse> register(@RequestBody RegisterRequest request) throws IOException {
        var response = authenticationService.register(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> authenticate(@RequestBody AuthenticationRequest request) {
        return ResponseEntity.ok(authenticationService.authenticate(request));
    }

    @PostMapping("/refresh-token")
    public void refreshToken(HttpServletRequest request, HttpServletResponse response) throws IOException {
        authenticationService.refreshToken(request, response);
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyCode(@RequestBody VerificationRequest request){
        return ResponseEntity.ok(authenticationService.verifyCode(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ForgotPasswordResponse> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        try {
            ForgotPasswordResponse response = authenticationService.forgotPassword(request.getEmail());
            return ResponseEntity.ok(response);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.badRequest()
                    .body(new ForgotPasswordResponse("User not found", false));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            AuthenticationResponse response = authenticationService.resetPassword(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException | EntityNotFoundException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/test-email")
    public ResponseEntity<String> testEmail(@RequestParam String email) {
        try {
            emailService.sendResetPasswordEmail(email, "123456");
            return ResponseEntity.ok("Email sent successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Email failed: " + e.getMessage());
        }
    }

    

}
