package com.app_template.App_Template.service.message;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.app_template.App_Template.entity.Message;
import com.app_template.App_Template.entity.MessageDto;
import com.app_template.App_Template.entity.User;
import com.app_template.App_Template.dto.UserDto;
import com.app_template.App_Template.repository.MessageRepository;
import com.app_template.App_Template.repository.UserRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    @Override
    public MessageDto sendMessage(Long senderId, Long receiverId, String content) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new EntityNotFoundException("Sender not found"));

        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new EntityNotFoundException("Receiver not found"));

        Message message = Message.builder()
                .sender(sender)
                .receiver(receiver)
                .content(content)
                .timestamp(LocalDateTime.now())
                .read(false)
                .build();

        Message savedMessage = messageRepository.save(message);
        return convertToDto(savedMessage);
    }

    @Override
    @Transactional
    public List<MessageDto> getConversation(Long userId1, Long userId2) {
        List<Message> messages = messageRepository.findConversation(userId1, userId2);
        return messages.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public Page<MessageDto> getConversationPaginated(Long userId1, Long userId2, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Message> messages = messageRepository.findConversationPaginated(userId1, userId2, pageable);
        return messages.map(this::convertToDto);
    }

    @Override
    @Transactional
    public List<MessageDto> getAllUsersForChat(Long currentUserId) {
        // Obține toți userii exceptând cel curent
        List<User> allUsers = userRepository.findAll();

        return allUsers.stream()
                .filter(user -> !user.getId().equals(currentUserId))
                .map(user -> {
                    // Găsește ultimul mesaj cu acest user
                    Message lastMessage = messageRepository.findLastMessage(currentUserId, user.getId());

                    // Numără mesajele necitite
                    Long unreadCount = messageRepository.countUnreadMessages(user.getId()) > 0
                            ? messageRepository.countUnreadMessages(user.getId())
                            : 0L;

                    // Creează un MessageDto special care reprezintă un user pentru lista de chat
                    MessageDto dto = new MessageDto();
                    dto.setReceiverId(user.getId());
                    dto.setReceiverName(user.getFirstname() + " " + user.getLastname());
                    dto.setReceiverEmail(user.getEmail());
                    dto.setReceiverImageUrl(user.getImageUrl());

                    if (lastMessage != null) {
                        dto.setContent(lastMessage.getContent());
                        dto.setTimestamp(lastMessage.getTimestamp());
                        dto.setRead(lastMessage.getRead());
                    }

                    // Folosim un câmp custom pentru unread count (poți adăuga în DTO)
                    // Pentru acum, folosim read=false dacă există mesaje necitite

                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void markMessagesAsRead(Long senderId, Long receiverId) {
        messageRepository.markMessagesAsRead(senderId, receiverId);
    }

    @Override
    public Long getUnreadCount(Long userId) {
        return messageRepository.countUnreadMessages(userId);
    }

    private MessageDto convertToDto(Message message) {
        return MessageDto.builder()
                .id(message.getId())
                .senderId(message.getSender().getId())
                .senderName(message.getSender().getFirstname() + " " + message.getSender().getLastname())
                .senderEmail(message.getSender().getEmail())
                .senderImageUrl(message.getSender().getImageUrl())
                .receiverId(message.getReceiver().getId())
                .receiverName(message.getReceiver().getFirstname() + " " + message.getReceiver().getLastname())
                .receiverEmail(message.getReceiver().getEmail())
                .receiverImageUrl(message.getReceiver().getImageUrl())
                .content(message.getContent())
                .timestamp(message.getTimestamp())
                .read(message.getRead())
                .build();
    }
}