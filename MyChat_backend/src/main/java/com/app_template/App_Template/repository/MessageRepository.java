package com.app_template.App_Template.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.app_template.App_Template.entity.Message;

public interface MessageRepository extends JpaRepository<Message, Long> {

    // Găsește toate mesajele între doi useri (bidirecțional)
    @Query("SELECT m FROM Message m WHERE " +
            "(m.sender.id = :userId1 AND m.receiver.id = :userId2) OR " +
            "(m.sender.id = :userId2 AND m.receiver.id = :userId1) " +
            "ORDER BY m.timestamp ASC")
    List<Message> findConversation(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    // Găsește conversația cu paginare
    @Query("SELECT m FROM Message m WHERE " +
            "(m.sender.id = :userId1 AND m.receiver.id = :userId2) OR " +
            "(m.sender.id = :userId2 AND m.receiver.id = :userId1) " +
            "ORDER BY m.timestamp DESC")
    Page<Message> findConversationPaginated(
            @Param("userId1") Long userId1,
            @Param("userId2") Long userId2,
            Pageable pageable
    );

    // Numără mesajele necitite pentru un utilizator
    @Query("SELECT COUNT(m) FROM Message m WHERE m.receiver.id = :receiverId AND m.read = false")
    Long countUnreadMessages(@Param("receiverId") Long receiverId);

    // Marchează mesajele ca citite între doi useri
    @Modifying
    @Query("UPDATE Message m SET m.read = true WHERE " +
            "m.sender.id = :senderId AND m.receiver.id = :receiverId AND m.read = false")
    void markMessagesAsRead(@Param("senderId") Long senderId, @Param("receiverId") Long receiverId);

    // Găsește ultimul mesaj între doi useri
    @Query("SELECT m FROM Message m WHERE " +
            "(m.sender.id = :userId1 AND m.receiver.id = :userId2) OR " +
            "(m.sender.id = :userId2 AND m.receiver.id = :userId1) " +
            "ORDER BY m.timestamp DESC LIMIT 1")
    Message findLastMessage(@Param("userId1") Long userId1, @Param("userId2") Long userId2);
}