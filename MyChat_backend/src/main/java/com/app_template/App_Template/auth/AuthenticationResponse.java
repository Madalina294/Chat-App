package com.app_template.App_Template.auth;

import com.app_template.App_Template.enums.Role;
import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Builder
@Data
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthenticationResponse {
    private Long userId;
    private String userFirstName;
    private String userLastName;
    private Role userRole;
    private String image;
    private String preferredTheme;
    private String preferredLanguage;
    private String googleId;
    private String accessToken;
    private String refreshToken;
    private boolean mfaEnabled;
    private String qrCodeUrl; // URL-ul QR code-ului pentru 2FA (rapid de generat)
}

