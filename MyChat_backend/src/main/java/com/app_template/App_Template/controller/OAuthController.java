package com.app_template.App_Template.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.app_template.App_Template.config.JwtService;
import com.app_template.App_Template.entity.User;
import com.app_template.App_Template.enums.Role;
import com.app_template.App_Template.repository.UserRepository;

@RestController
@RequestMapping("/api/auth")
public class OAuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;



    @GetMapping("/oauth-success")
    public ResponseEntity<?> oauthSuccess() {
        try {
            org.springframework.security.core.Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            System.out.println("Authentication type: " + (authentication != null ? authentication.getClass().getSimpleName() : "null"));
            System.out.println("Authentication: " + authentication);
            
            if (authentication == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "No authentication found"
                ));
            }
            
            if (!(authentication instanceof OAuth2AuthenticationToken)) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Authentication is not OAuth2 type: " + authentication.getClass().getSimpleName()
                ));
            }
            
            OAuth2AuthenticationToken token = (OAuth2AuthenticationToken) authentication;
            OAuth2User oauth2User = token.getPrincipal();
            String email = oauth2User.getAttribute("email");
            String name = oauth2User.getAttribute("name");
            String googleId = oauth2User.getAttribute("sub"); // Google ID-ul utilizatorului
            String imageUrl = oauth2User.getAttribute("picture"); // URL-ul imaginii Google
            
            // Debug pentru Google ID
            System.out.println("=== DEBUG: OAuth2 Attributes ===");
            System.out.println("Email: " + email);
            System.out.println("Name: " + name);
            System.out.println("Google ID: " + googleId);
            System.out.println("Image URL: " + imageUrl);
            System.out.println("=== END DEBUG ===");
            
            // Afișează toate atributele pentru debugging
            oauth2User.getAttributes().forEach((key, value) -> {
                System.out.println("Attribute [" + key + "]: " + value);
            });

            // Verifică dacă utilizatorul există
            Optional<User> existingUser = userRepository.findByEmail(email);
            
            if (existingUser.isPresent()) {
                // Login existent - actualizează cu datele Google
                User user = existingUser.get();
                
                // Actualizează datele cu informațiile de la Google
                if (googleId != null && !googleId.isEmpty()) {
                    user.setGoogleId(googleId);
                    System.out.println("Setting Google ID for existing user: " + googleId);
                } else {
                    System.out.println("Google ID is null or empty, not updating");
                }
                // Actualizează imaginea DOAR dacă utilizatorul nu are deja o imagine personalizată
                if (imageUrl != null && !imageUrl.isEmpty() && 
                    (user.getImageUrl() == null || user.getImageUrl().isEmpty() || 
                    user.getImageUrl().contains("googleusercontent.com"))) {
                    user.setImageUrl(imageUrl);
                    System.out.println("Setting image URL for existing user: " + imageUrl);
                } else {
                    System.out.println("Keeping existing user image: " + user.getImageUrl());
                }
                
                // Salvează modificările
                userRepository.save(user);
                System.out.println("User saved with Google ID: " + user.getGoogleId());
                
                String jwtToken = jwtService.generateToken(user);

                return ResponseEntity.status(HttpStatus.FOUND)
                    .header("Location", "http://localhost:4200/oauth-callback?token=" + jwtToken + "&userId=" + user.getId() + "&googleId=" + (googleId != null ? googleId : ""))
                    .build();
            } else {
                // Creează utilizator nou
                String[] nameParts = name != null ? name.split(" ") : new String[]{"", ""};
                String firstName = nameParts.length > 0 ? nameParts[0] : "";
                String lastName = nameParts.length > 1 ? nameParts[1] : "";



                System.out.println("Creating new user with Google ID: " + googleId);
                
                User newUser = User.builder()
                    .email(email)
                    .firstname(firstName)
                    .lastname(lastName)
                    .role(Role.USER)
                    .mfaEnabled(false)
                    .imageUrl(imageUrl)  // Adaugă imaginea Google
                    .googleId(googleId)  // Adaugă Google ID-ul
                    .createdAt(LocalDateTime.now())
                    .build();
                
                userRepository.save(newUser);
                System.out.println("New user saved with Google ID: " + newUser.getGoogleId());
                String jwtToken = jwtService.generateToken(newUser);

                // Redirecționează cu token-ul și Google ID-ul în URL (fără imagine pentru a evita header prea mare)
                return ResponseEntity.status(HttpStatus.FOUND)
                    .header("Location", "http://localhost:4200/oauth-callback?token=" + jwtToken + "&userId=" + newUser.getId() + "&googleId=" + (googleId != null ? googleId : ""))
                    .build();
            }
        } catch (Exception e) {
            System.err.println("OAuth Error: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "error", "OAuth authentication failed: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/oauth-failure")
    public ResponseEntity<?> oauthFailure() {
        return ResponseEntity.badRequest().body(Map.of(
            "error", "OAuth authentication failed"
        ));
    }

    @GetMapping("/oauth-user-data")
    public ResponseEntity<?> getOAuthUserData(@RequestParam Long userId, @RequestParam(required = false) String googleId) {
        try {
            System.out.println("OAuth User Data Request - userId: " + userId + ", googleId: " + googleId);
            Optional<User> userOpt = userRepository.findById(userId);
            if (!userOpt.isPresent()) {
                System.out.println("User not found with ID: " + userId);
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "User not found"
                ));
            }

            User user = userOpt.get();
            System.out.println("Found user: " + user.getEmail() + ", imageUrl: " + user.getImageUrl() + ", googleId: " + user.getGoogleId());

            // Creează un Map cu datele utilizatorului incluzând Google ID-ul
            Map<String, Object> userData = new HashMap<>();
            userData.put("userId", user.getId());
            userData.put("userFirstName", user.getFirstname());
            userData.put("userLastName", user.getLastname());
            userData.put("email", user.getEmail());
            userData.put("userRole", user.getRole().name());
            userData.put("image", user.getImageUrl() != null ? user.getImageUrl() : "");
            userData.put("mfaEnabled", user.isMfaEnabled());
            userData.put("googleId", user.getGoogleId() != null ? user.getGoogleId() : "");
            userData.put("createdAt", user.getCreatedAt() != null ? user.getCreatedAt() : "");
            userData.put("preferredTheme", user.getPreferredTheme() != null ? user.getPreferredTheme() : "dark");

            System.out.println("Returning user data: " + userData);
            return ResponseEntity.ok(userData);
        } catch (Exception e) {
            System.out.println("Error in OAuth user data: " + e.getMessage());
            e.printStackTrace();
            Map<String, Object> errorData = new HashMap<>();
            errorData.put("error", "Failed to get user data: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorData);
        }
    }
}
