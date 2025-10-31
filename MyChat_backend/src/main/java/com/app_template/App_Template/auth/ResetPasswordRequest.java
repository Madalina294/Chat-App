package com.app_template.App_Template.auth;

import lombok.Data;

@Data
public class ResetPasswordRequest {
    private String email;
    private String resetCode;
    private String newPassword;
}
