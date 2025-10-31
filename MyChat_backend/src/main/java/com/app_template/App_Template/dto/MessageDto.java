package com.app_template.App_Template.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageDto {
    private Long id;
    private Long senderId;
    private String senderName;
    private String senderEmail;
    private String senderImageUrl;
    private Long receiverId;
    private String receiverName;
    private String receiverEmail;
    private String receiverImageUrl;
    private String content;
    private LocalDateTime timestamp;
    private Boolean read;
}