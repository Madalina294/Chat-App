package com.app_template.App_Template.config;

import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Configurează servirea fișierelor din folderul uploads
        Path uploadDir = Paths.get("uploads");
        String uploadPath = uploadDir.toFile().getAbsolutePath();

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadPath + "/");

        System.out.println("=== DEBUG: WebConfig ===");
        System.out.println("Upload directory: " + uploadPath);
        System.out.println("Resource handler configured for /uploads/**");
        System.out.println("=== END DEBUG ===");
    }
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
            .allowedOrigins("http://localhost:4200") // sau "*" la nevoie (nu recomandat pentru production!)
            .allowedMethods("*")
            .allowedHeaders("*")
            .allowCredentials(true);
    }
}
