package com.app_template.App_Template.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component; // Adaugă această adnotare

@Component // Adaugă această adnotare pentru a face clasa un Spring Bean
public class JwtChannelInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final java.util.Map<String, Authentication> sessionAuthMap = new java.util.concurrent.ConcurrentHashMap<>();

    // Constructor cu @Autowired (opțional în Spring moderne, dar bine de avut)
    @Autowired
    public JwtChannelInterceptor(JwtService jwtService, UserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    public Authentication getAuthentication(String sessionId) {
        if (sessionId == null) {
            return null;
        }
        return sessionAuthMap.get(sessionId);
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        var accessor = StompHeaderAccessor.wrap(message);

        // Obține session ID pentru toate comenzile STOMP
        String sessionId = accessor.getSessionId();

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            // 1) Extrage Authorization din header-ele STOMP CONNECT:
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                throw new MessageDeliveryException("Missing or invalid Authorization header");
            }
            String token = authHeader.substring(7);

            // 2) Validează JWT
            try {
                String username = jwtService.extractUsername(token);
                var userDetails = userDetailsService.loadUserByUsername(username);

                if (!jwtService.isTokenValid(token, userDetails)) {
                    throw new MessageDeliveryException("Invalid token");
                }

                // 3) Construiește Authentication și setează-l
                var auth = new UsernamePasswordAuthenticationToken(
                        userDetails.getUsername(),
                        null,
                        userDetails.getAuthorities()
                );

                // Salvează Authentication în Map pentru această sesiune
                if (sessionId != null) {
                    sessionAuthMap.put(sessionId, auth);
                }

                SecurityContextHolder.getContext().setAuthentication(auth);
                accessor.setUser(auth);

                return MessageBuilder.createMessage(message.getPayload(), accessor.getMessageHeaders());
            } catch (Exception e) {
                throw new MessageDeliveryException("Authentication failed: " + e.getMessage());
            }
        }

        // Pentru DISCONNECT, șterge authentication-ul din Map
        if (StompCommand.DISCONNECT.equals(accessor.getCommand())) {
            if (sessionId != null) {
                sessionAuthMap.remove(sessionId);
            }
            return message;
        }

        // Pentru alte comenzi STOMP (SEND, SUBSCRIBE, etc.), restaurează Authentication din Map
        Authentication auth = null;

        // Încearcă să obțină Authentication din SecurityContext (rareori funcționează pentru mesaje STOMP ulterioare)
        auth = SecurityContextHolder.getContext().getAuthentication();

        // Dacă nu există în SecurityContext, încearcă să-l obții din Map folosind session ID
        if (auth == null && sessionId != null) {
            auth = sessionAuthMap.get(sessionId);
        }

        // Fallback: încearcă să-l obții din Principal (dacă Map-ul nu funcționează)
        if (auth == null) {
            java.security.Principal principal = accessor.getUser();

            if (principal instanceof Authentication) {
                auth = (Authentication) principal;
            } else if (principal != null) {
                try {
                    var userDetails = userDetailsService.loadUserByUsername(principal.getName());
                    auth = new UsernamePasswordAuthenticationToken(
                            userDetails.getUsername(),
                            null,
                            userDetails.getAuthorities()
                    );
                } catch (Exception e) {
                    // Nu aruncăm excepție aici, vom verifica mai jos
                }
            }
        }

        // Setează Authentication în SecurityContext și pe accessor
        if (auth != null) {
            SecurityContextHolder.getContext().setAuthentication(auth);
            accessor.setUser(auth);

            // Actualizează Map-ul dacă nu exista (pentru siguranță)
            if (sessionId != null && !sessionAuthMap.containsKey(sessionId)) {
                sessionAuthMap.put(sessionId, auth);
            }
        } else {
            // Dacă Authentication este încă null, utilizatorul nu este autentificat
            throw new MessageDeliveryException("User not authenticated for STOMP message");
        }

        return message;
    }
}