package com.app_template.App_Template.auth;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class UpdateInfosRequest {
    private Long userId;
    private String firstName;
    private String lastName;
    private String email;
    private MultipartFile image;
    private boolean mfaEnabled;
}
