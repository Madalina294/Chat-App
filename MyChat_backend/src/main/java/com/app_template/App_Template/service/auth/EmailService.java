package com.app_template.App_Template.service.auth;

import com.app_template.App_Template.entity.User;
import com.app_template.App_Template.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

import java.util.Optional;

// EmailService.java
@Service
@RequiredArgsConstructor
public class EmailService {

    @Autowired
    private final UserRepository userRepository;

    @Autowired
    private JavaMailSender mailSender;
    
    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendResetPasswordEmail(String toEmail, String resetCode) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail); // Use the configured email from properties
            message.setTo(toEmail);
            message.setSubject("Password Reset Code - Your App");
            message.setText(
                "Hello,\n\n" +
                "Your password reset code is: " + resetCode + "\n\n" +
                "This code will expire in 15 minutes.\n\n" +
                "If you didn't request this, please ignore this email.\n\n" +
                "Best regards,\n" +
                "App Team"
            );

            mailSender.send(message);
            
        } catch (Exception e) {
            System.err.println("Failed to send email to " + toEmail + ": " + e.getMessage());
            System.err.println("Exception type: " + e.getClass().getSimpleName());
            e.printStackTrace();
            throw new RuntimeException("Email sending failed: " + e.getMessage(), e);
        }
    }

    public void sendDeleteAccountEmail(String toEmail, String username) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail); // Use the configured email from properties
            message.setTo(toEmail);
            message.setSubject("Delete Account - App");
            message.setText(
                    "Hello, "+ username +"\n\n" +
                    "This is to inform you that your account with App has been deleted by the administrator.\n" +
                    "If you believe this action was taken in error or you wish to appeal, please contact us at " + fromEmail+".\n\n" +
                    "Thank you,\n" +
                    "App Team"
            );

            mailSender.send(message);

        } catch (Exception e) {
            System.err.println("Failed to send email to " + toEmail + ": " + e.getMessage());
            System.err.println("Exception type: " + e.getClass().getSimpleName());
            e.printStackTrace();
            throw new RuntimeException("Email sending failed: " + e.getMessage(), e);
        }
    }

    public void sendWelcomeEmail(String toEmail, String username) {
         try{
             SimpleMailMessage message = new SimpleMailMessage();
             message.setFrom(fromEmail);
             message.setTo(toEmail);
             message.setSubject("Welcome to App");
             message.setText(
                     "Hello, " + username + "\n\n" +
                     "Welcome to App — we’re excited to have you on board!" + "\n"
             );
             mailSender.send(message);
         } catch (Exception e){
             System.err.println("Failed to send email to " + toEmail + ": " + e.getMessage());
         }
    }

    public void sendCustomEmail(String toEmail, String subject, String body) {
        try{
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(body);

            mailSender.send(message);
        } catch(Exception e){
            System.err.println("Failed to send email to " + toEmail + ": " + e.getMessage());
            System.err.println("Exception type: " + e.getClass().getSimpleName());
            e.printStackTrace();
            throw new RuntimeException("Email sending failed: " + e.getMessage(), e);
        }
    }
}
