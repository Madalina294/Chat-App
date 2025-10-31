package com.app_template.App_Template.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.messaging.access.intercept.MessageMatcherDelegatingAuthorizationManager;

@Configuration
public class StompMessageSecurityConfig {

    @Bean
    public AuthorizationManager<Message<?>> messageAuthorizationManager() {
        MessageMatcherDelegatingAuthorizationManager.Builder messages =
                MessageMatcherDelegatingAuthorizationManager.builder();

        messages
                .simpDestMatchers("/app/**").authenticated()           // SEND către /app/** doar autentificat
                .simpSubscribeDestMatchers("/topic/**").authenticated() // SUBSCRIBE către /topic/** doar autentificat
                .anyMessage().denyAll();

        return messages.build();
    }
}