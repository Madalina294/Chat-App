package com.app_template.App_Template.service.user;

import com.app_template.App_Template.auth.UpdateInfosRequest;
import com.app_template.App_Template.auth.UpdatePasswordRequest;
import com.app_template.App_Template.dto.UserDto;

import java.io.IOException;

public interface UserService {
    void deleteAccount(Long userId);
    UserDto updateProfileInfos(UpdateInfosRequest request) throws IOException;
    UserDto updatePassword(UpdatePasswordRequest request);
    UserDto updatePreferredTheme(Long userId, String theme);
    UserDto updatePreferredLanguage(Long userId, String language);

}
