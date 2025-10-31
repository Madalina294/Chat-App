package com.app_template.App_Template.service.message;

import java.util.List;

import org.springframework.data.domain.Page;

import com.app_template.App_Template.dto.MessageDto;

public interface MessageService {

    MessageDto sendMessage(Long senderId, Long receiverId, String content);

    List<MessageDto> getConversation(Long userId1, Long userId2);

    Page<MessageDto> getConversationPaginated(Long userId1, Long userId2, int page, int size);

    List<MessageDto> getAllUsersForChat(Long currentUserId);

    void markMessagesAsRead(Long senderId, Long receiverId);

    Long getUnreadCount(Long userId);
}