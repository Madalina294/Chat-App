package com.app_template.App_Template.service.image;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class ImageServiceImpl implements ImageService {

    @Value("${app.upload.dir:uploads/users/}")
    private String uploadDir;

    // Tipuri MIME permise pentru imagini
    private static final List<String> ALLOWED_MIME_TYPES = Arrays.asList(
            "image/jpeg",
            "image/jpg", 
            "image/png",
            "image/gif",
            "image/webp"
    );

    // Extensii permise
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
            "jpg", "jpeg", "png", "gif", "webp"
    );

    // Dimensiunea maximă a fișierului (5MB)
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;

    @Override
    public String saveUserImage(Long userId, MultipartFile file) throws IOException {
        // Validări de securitate
        validateImageFile(file);

        // Creează directorul dacă nu există
        File directory = new File(uploadDir);
        if (!directory.exists()) {
            boolean created = directory.mkdirs();
            if (!created) {
                throw new IOException("Failed to create upload directory: " + uploadDir);
            }
        }

        // Generează numele fișierului
        String extension = getFileExtension(file.getOriginalFilename());
        String fileName = "user_" + userId + "." + extension;
        Path filePath = Paths.get(uploadDir, fileName);

        // Șterge imaginea veche dacă există
        deleteUserImage(userId);

        // Salvează fișierul nou
        try {
            Files.write(filePath, file.getBytes());
            log.info("Image saved successfully for user {}: {}", userId, fileName);
            return getImageUrl(userId, fileName);
        } catch (IOException e) {
            log.error("Failed to save image for user {}: {}", userId, e.getMessage());
            throw new IOException("Failed to save image: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteUserImage(Long userId) throws IOException {
        File directory = new File(uploadDir);
        if (!directory.exists()) {
            return;
        }

        // Caută și șterge toate fișierele pentru utilizatorul dat
        File[] files = directory.listFiles((dir, name) -> name.startsWith("user_" + userId + "."));
        if (files != null) {
            for (File file : files) {
                if (file.delete()) {
                    log.info("Deleted old image for user {}: {}", userId, file.getName());
                } else {
                    log.warn("Failed to delete old image for user {}: {}", userId, file.getName());
                }
            }
        }
    }

    @Override
    public boolean isValidImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return false;
        }

        // Verifică tipul MIME
        String contentType = file.getContentType();
        if (contentType == null) {
            return false;
        }
        if (!ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
            return false;
        }

        // Verifică extensia
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            return false;
        }
        
        String extension = getFileExtension(originalFilename);
        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            return false;
        }

        // Verifică dimensiunea
        if (file.getSize() > MAX_FILE_SIZE) {
            return false;
        }

        return true;
    }

    @Override
    public String getImageUrl(Long userId, String fileName) {
        return "/uploads/users/" + fileName;
    }

    private void validateImageFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Image file is required");
        }

        if (!isValidImageFile(file)) {
            throw new IllegalArgumentException(
                "Invalid image file. Allowed types: " + ALLOWED_EXTENSIONS + 
                ", Max size: " + (MAX_FILE_SIZE / 1024 / 1024) + "MB"
            );
        }
    }

    private String getFileExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            throw new IllegalArgumentException("Invalid file name: " + fileName);
        }
        
        String extension = fileName.substring(fileName.lastIndexOf(".") + 1);
        if (extension.isEmpty()) {
            throw new IllegalArgumentException("File must have an extension");
        }
        
        return extension;
    }
}
