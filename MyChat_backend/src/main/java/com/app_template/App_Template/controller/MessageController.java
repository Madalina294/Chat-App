package com.app_template.App_Template.controller;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;

import com.app_template.App_Template.config.JwtChannelInterceptor;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.app_template.App_Template.dto.MessageDto;
import com.app_template.App_Template.entity.User;
import com.app_template.App_Template.repository.UserRepository;
import com.app_template.App_Template.service.message.MessageService;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.Header;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private MessageService messageService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtChannelInterceptor jwtChannelInterceptor;

    // DTO pentru WebSocket
    public static class ChatMessageDto {
        public Long id;
        public String sender;
        public String receiver;
        public String content;
        public LocalDateTime timestamp;
        public Long senderId;
        public Long receiverId;
    }


    // WebSocket endpoint - trimite mesaj
    @MessageMapping("/chat.sendMessage")
    public void sendMessage(
            ChatMessageDto message,
            @Header("simpSessionId") String sessionId  // Obține session ID din header-ul STOMP
    ) {
        if (message != null && message.receiverId != null) {
            // Obține Authentication din Map folosind session ID
            Authentication authentication = jwtChannelInterceptor.getAuthentication(sessionId);

            if (authentication == null || authentication.getName() == null) {
                throw new RuntimeException("User not authenticated");
            }

            // Extrage username-ul din Authentication
            String username = authentication.getName();

            User sender = userRepository.findByEmail(username)
                    .orElseThrow(() -> new EntityNotFoundException("User not found"));

            User receiver = userRepository.findById(message.receiverId)
                    .orElseThrow(() -> new EntityNotFoundException("Receiver not found"));

            // Salvează mesajul în DB
            MessageDto savedMessage = messageService.sendMessage(
                    sender.getId(),
                    receiver.getId(),
                    message.content
            );

            // Trimite mesajul către receiver prin WebSocket
            messagingTemplate.convertAndSendToUser(
                    receiver.getEmail(),
                    "/queue/messages",
                    savedMessage
            );

            // Trimite și înapoi către sender pentru confirmare
            messagingTemplate.convertAndSendToUser(
                    sender.getEmail(),
                    "/queue/messages",
                    savedMessage
            );
        }
    }

    // REST endpoint - obține lista de useri pentru chat
    @GetMapping("/users")
    public ResponseEntity<List<MessageDto>> getAllUsersForChat(Authentication authentication) {
        User currentUser = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        List<MessageDto> users = messageService.getAllUsersForChat(currentUser.getId());
        return ResponseEntity.ok(users);
    }

    // REST endpoint - obține conversația cu un user
    @GetMapping("/conversation/{userId}")
    public ResponseEntity<List<MessageDto>> getConversation(
            @PathVariable Long userId,
            Authentication authentication) {
        User currentUser = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        List<MessageDto> messages = messageService.getConversation(currentUser.getId(), userId);
        return ResponseEntity.ok(messages);
    }

    // REST endpoint - marchează mesajele ca citite
    @PostMapping("/mark-read/{userId}")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long userId,
            Authentication authentication) {
        User currentUser = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        messageService.markMessagesAsRead(userId, currentUser.getId());
        return ResponseEntity.ok().build();
    }

    // REST endpoint - obține numărul de mesaje necitite
    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(Authentication authentication) {
        User currentUser = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new EntityNotFoundException("User not found"));

        Long count = messageService.getUnreadCount(currentUser.getId());
        return ResponseEntity.ok(count);
    }
}