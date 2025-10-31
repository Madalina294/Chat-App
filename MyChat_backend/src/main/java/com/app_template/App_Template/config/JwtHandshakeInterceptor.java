package com.app_template.App_Template.config;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    public JwtHandshakeInterceptor(JwtService jwtService, UserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {

        String path = request.getURI().getPath();

        // Permite cererile statice SockJS (iframe.html, info, etc.) fără validare token
        if (path != null && (
                path.contains("/iframe.html") ||
                        path.contains("/websocket") || // Nu este handshake real încă
                        path.contains("/xhr") ||
                        path.contains("/xhr_send") ||
                        path.contains("/xhr_streaming") ||
                        path.contains("/eventsource") ||
                        path.contains("/jsonp") ||
                        path.contains("/info")
        )) {
            // Pentru cererile SockJS statice, permite accesul
            // Acestea nu sunt handshake-ul real WebSocket
            return true;
        }

        // Pentru handshake-ul real WebSocket, verifică token-ul
        String token = null;

        // 1) Încearcă token din query param: /ws?access_token=...
        var query = request.getURI().getQuery();
        if (query != null && query.contains("access_token=")) {
            token = java.util.Arrays.stream(query.split("&"))
                    .filter(p -> p.startsWith("access_token="))
                    .map(p -> p.substring("access_token=".length()))
                    .findFirst().orElse(null);
        }

        // 2) Sau din header Authorization
        if (token == null && request.getHeaders().containsKey("Authorization")) {
            String auth = request.getHeaders().getFirst("Authorization");
            if (auth != null && auth.startsWith("Bearer ")) {
                token = auth.substring(7);
            }
        }

        // 3) Dacă nu găsește token și este handshake real, blochează
        if (token == null) {
            response.setStatusCode(org.springframework.http.HttpStatus.UNAUTHORIZED);
            return false;
        }

        // 4) Validează token-ul
        try {
            String username = jwtService.extractUsername(token);
            var userDetails = userDetailsService.loadUserByUsername(username);

            if (!jwtService.isTokenValid(token, userDetails)) {
                response.setStatusCode(org.springframework.http.HttpStatus.UNAUTHORIZED);
                return false;
            }

            // Pune username în attributes pentru a-l folosi ulterior
            attributes.put("username", username);
            return true;
        } catch (Exception e) {
            // Dacă validarea eșuează, blochează handshake-ul
            response.setStatusCode(org.springframework.http.HttpStatus.UNAUTHORIZED);
            return false;
        }
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
        // Nu face nimic după handshake
    }
}