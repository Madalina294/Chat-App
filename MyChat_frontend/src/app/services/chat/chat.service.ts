import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { StorageService } from '../storage/storage.service';
import { map } from 'rxjs/operators';

export interface ChatMessageDto {
  id?: number;
  senderId?: number;
  senderName?: string;
  senderEmail?: string;
  senderImageUrl?: string;
  receiverId?: number;
  receiverName?: string;
  receiverEmail?: string;
  receiverImageUrl?: string;
  content: string;
  timestamp?: string;
  read?: boolean;
}

export interface UserForChat {
  userId: number;
  name: string;
  email: string;
  imageUrl?: string;
  lastMessage?: string;
  lastMessageTimestamp?: string;
  unreadCount?: number;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private client: Client | null = null;
  private subscription: StompSubscription | null = null;
  private messagesSubject = new BehaviorSubject<ChatMessageDto[]>([]);
  private currentReceiverId: number | null = null;
  private messagesByConversation = new Map<string, BehaviorSubject<ChatMessageDto[]>>();

  constructor(private http: HttpClient) {}

  private createAuthorizationHeader(): HttpHeaders {
    const token = StorageService.getToken();
    if (!token) {
      console.error('No token found in storage');
      return new HttpHeaders();
    }

    return new HttpHeaders({
      'Authorization': 'Bearer ' + token
    });
  }

  connect(): void {
    if (typeof window === 'undefined') {
      return;
    }

    if (this.client?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    const token = StorageService.getToken();
    if (!token) {
      console.error('No token available for WebSocket connection');
      return;
    }

    console.log('Attempting WebSocket connection...');

    try {
      // Construiește URL-ul SockJS cu token-ul în query string
      // Acest token va fi verificat de JwtHandshakeInterceptor
      const sockJsUrl = `http://localhost:8080/ws?access_token=${encodeURIComponent(token)}`;

      this.client = new Client({
        webSocketFactory: () => new SockJS(sockJsUrl),
        // Păstrează și connectHeaders pentru STOMP CONNECT frame
        connectHeaders: {
          Authorization: `Bearer ${token}`
        },
        reconnectDelay: 3000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000
      });

      this.client.onStompError = (frame) => {
        console.error('STOMP error:', frame);
        console.error('STOMP error headers:', frame.headers);
        console.error('STOMP error body:', frame.body);
      };

      this.client.onWebSocketError = (event) => {
        console.error('WebSocket error:', event);
      };

      this.client.onConnect = (frame) => {
        console.log('WebSocket connected successfully:', frame);
        this.subscribeToPrivateMessages();
      };

      this.client.onDisconnect = () => {
        console.log('WebSocket disconnected');
      };

      this.client.activate();
      console.log('WebSocket activation initiated');
    } catch (e) {
      console.error('Failed to initialize STOMP client:', e);
    }
  }

  private subscribeToPrivateMessages(): void {
    if (!this.client?.connected) return;

    // Obține email-ul user-ului curent din token
    const user = StorageService.getUser();
    if (!user?.email) return;

    // Subscribe la mesajele private
    // Spring folosește /user/{username}/queue/messages
    const destination = `/user/${user.email}/queue/messages`;

    this.subscription = this.client.subscribe(destination, (msg: IMessage) => {
      try {
        const dto: ChatMessageDto = JSON.parse(msg.body);

        // Adaugă mesajul în conversația corespunzătoare
        this.addMessageToConversation(dto);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });
  }

  private addMessageToConversation(message: ChatMessageDto): void {
    const currentUserId = StorageService.getUserId();
    const otherUserId = message.senderId === currentUserId
      ? message.receiverId
      : message.senderId;

    if (!otherUserId) return;

    const conversationKey = this.getConversationKey(currentUserId, otherUserId);

    if (!this.messagesByConversation.has(conversationKey)) {
      this.messagesByConversation.set(conversationKey, new BehaviorSubject<ChatMessageDto[]>([]));
    }

    const subject = this.messagesByConversation.get(conversationKey)!;
    const currentMessages = subject.value;

    // Verifică dacă mesajul există deja (după id)
    if (!currentMessages.find(m => m.id === message.id)) {
      subject.next([...currentMessages, message]);
    }

    // Dacă este conversația curentă, actualizează și messagesSubject
    if (this.currentReceiverId === otherUserId) {
      this.messagesSubject.next([...currentMessages, message]);
    }
  }

  private getConversationKey(userId1: number, userId2: number): string {
    const min = Math.min(userId1, userId2);
    const max = Math.max(userId1, userId2);
    return `${min}-${max}`;
  }

  subscribeToConversation(receiverId: number): Observable<ChatMessageDto[]> {
    if (!this.client) this.connect();

    const currentUserId = StorageService.getUserId();
    const conversationKey = this.getConversationKey(currentUserId, receiverId);

    if (!this.messagesByConversation.has(conversationKey)) {
      this.messagesByConversation.set(conversationKey, new BehaviorSubject<ChatMessageDto[]>([]));
    }

    this.currentReceiverId = receiverId;
    this.messagesSubject = this.messagesByConversation.get(conversationKey)!;

    return this.messagesSubject.asObservable();
  }

  send(message: ChatMessageDto): void {
    if (!this.client) this.connect();

    if (!this.client?.connected) {
      console.error('WebSocket not connected');
      return;
    }

    const currentUserId = StorageService.getUserId();

    this.client.publish({
      destination: '/app/chat.sendMessage',
      body: JSON.stringify({
        content: message.content,
        receiverId: message.receiverId,
        senderId: currentUserId
      })
    });
  }

  // REST endpoint - obține lista de useri
  getAllUsers(): Observable<UserForChat[]> {
    return this.http.get<ChatMessageDto[]>('http://localhost:8080/api/messages/users', {
      headers: this.createAuthorizationHeader()
    }).pipe(
      map((dtos: ChatMessageDto[]) => {
        return dtos.map(dto => ({
          userId: dto.receiverId!,
          name: dto.receiverName || '',
          email: dto.receiverEmail || '',
          imageUrl: dto.receiverImageUrl,
          lastMessage: dto.content,
          lastMessageTimestamp: dto.timestamp,
          unreadCount: dto.read === false ? 1 : 0
        }));
      })
    );
  }

  // REST endpoint - obține istoricul conversației
  getConversationHistory(userId: number): Observable<ChatMessageDto[]> {
    return this.http.get<ChatMessageDto[]>(
      `http://localhost:8080/api/messages/conversation/${userId}`,
      {
        headers: this.createAuthorizationHeader() // Adaugă headers aici
      }
    );
  }

  // REST endpoint - marchează mesajele ca citite
  markAsRead(userId: number): Observable<void> {
    return this.http.post<void>(
      `http://localhost:8080/api/messages/mark-read/${userId}`,
      {},
      {
        headers: this.createAuthorizationHeader() // Adaugă headers aici
      }
    );
  }

  // REST endpoint - obține numărul de mesaje necitite
  getUnreadCount(): Observable<number> {
    return this.http.get<number>('http://localhost:8080/api/messages/unread-count', {
      headers: this.createAuthorizationHeader() // Adaugă headers aici
    }).pipe(
      map(count => count || 0)
    );
  }

  disconnect(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this.messagesByConversation.clear();
    this.client?.deactivate();
    this.client = null;
    this.currentReceiverId = null;
  }
}
