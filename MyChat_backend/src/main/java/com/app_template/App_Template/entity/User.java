package com.app_template.App_Template.entity;

import java.time.LocalDateTime;
import java.util.Collection;

import com.app_template.App_Template.dto.UserDto;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.app_template.App_Template.enums.Role;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name="users")
public class User implements UserDetails {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String firstname;
    private String lastname;
    private String email;
    private String password;
    private String imageUrl;
    private String googleId;
    private LocalDateTime createdAt;
    private String preferredTheme;
    private String preferredLanguage;
    private boolean mfaEnabled;
    private String secret;
    private String resetPasswordToken;
    private LocalDateTime resetPasswordExpiry;

    public UserDto getUserDto() {
        UserDto userDto = new UserDto();
        userDto.setUserId(id);
        userDto.setFirstName(firstname);
        userDto.setLastName(lastname);
        userDto.setEmail(email);
        userDto.setCreatedAt(createdAt);
        userDto.setImageUrl(imageUrl);
        userDto.setPreferredTheme(preferredTheme);
        userDto.setPreferredLanguage(preferredLanguage);
        userDto.setGoogleId(googleId);
        userDto.setMfaEnabled(mfaEnabled);
        return userDto;
    }

    @Enumerated(EnumType.STRING)
    private Role role;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return role.getAuthorities();
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
