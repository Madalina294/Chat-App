package com.app_template.App_Template.auth;

import lombok.Data;

@Data
public class UpdatePasswordRequest {
    private Long userId;
    private String currentPassword;
    private String newPassword;
}
