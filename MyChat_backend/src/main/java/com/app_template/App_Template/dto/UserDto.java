package com.app_template.App_Template.dto;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class UserDto {
    private Long userId;
    private String firstName;
    private String lastName;
    private String email;
    private String imageUrl;
    private String googleId;
    private boolean mfaEnabled;
    private String preferredTheme;
    private String preferredLanguage;
    private LocalDateTime createdAt;
}
