import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID, signal, computed, effect } from '@angular/core';
import { ChatService, ChatMessageDto, UserForChat } from '../../services/chat/chat.service';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { isPlatformBrowser, NgForOf, NgIf } from '@angular/common';
import { StorageService } from '../../services/storage/storage.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  imports: [
    FormsModule,
    NgForOf,
    NgIf
  ],
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy {
  // Signals pentru state management optimizat
  selectedUserId = signal<number | null>(null);
  selectedUserName = signal<string>('');
  selectedUserImageUrl = signal<string | null>(null);
  availableUsers = signal<UserForChat[]>([]);
  messages = signal<ChatMessageDto[]>([]);
  content = signal<string>(''); // Folosit cu [ngModel] și two-way binding

  private sub?: Subscription;
  readonly currentUserId: number = -1;

  // Computed signals pentru valori derivate
  hasSelectedUser = computed(() => this.selectedUserId() !== null);
  selectedUserInfo = computed(() => {
    const userId = this.selectedUserId();
    const userName = this.selectedUserName();
    const userImageUrl = this.selectedUserImageUrl();

    return userId ? { userId, userName, userImageUrl } : null;
  });

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private chat: ChatService
  ) {
    this.currentUserId = StorageService.getUserId();

    // Effect pentru a reacționa la schimbări în selectedUserId
    effect(() => {
      const userId = this.selectedUserId();
      if (userId !== null) {
        this.loadConversation(userId);
      }
    });
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        this.chat.connect();
        this.loadAvailableUsers();
      } catch (e) {
        console.error('Chat connect failed:', e);
      }
    }
  }

  loadAvailableUsers(): void {
    this.chat.getAllUsers().subscribe({
      next: (users) => {
        this.availableUsers.set(users); // Setează signal
        console.log('Available users:', users);
      },
      error: (err) => {
        console.error('Error loading users:', err);
      }
    });
  }

  selectUser(userId: number, userName: string, userImageUrl?: string): void {
    // Actualizează signals
    this.selectedUserId.set(userId);
    this.selectedUserName.set(userName);
    this.selectedUserImageUrl.set(userImageUrl || null);

    // Marchează mesajele ca citite
    this.chat.markAsRead(userId).subscribe({
      next: () => {
        console.log('Messages marked as read');
        // Actualizează availableUsers pentru a elimina badge-ul de unread
        this.updateUserUnreadCount(userId, 0);
      },
      error: (err) => {
        console.error('Error marking messages as read:', err);
      }
    });

    this.loadConversation(userId);

    // loadConversation va fi apelat automat prin effect()
  }

  loadConversation(userId: number): void {
    // Anulează abonarea anterioară
    this.sub?.unsubscribe();
    this.messages.set([]); // Resetează mesajele

    // Încarcă istoricul din REST API
    this.chat.getConversationHistory(userId).subscribe({
      next: (history) => {
        this.messages.set(history); // Setează signal
        console.log('Conversation history loaded:', history);
      },
      error: (err) => {
        console.error('Error loading conversation history:', err);
      }
    });

    // Subscribe la mesaje noi prin WebSocket
    this.sub = this.chat.subscribeToConversation(userId).subscribe({
      next: (messages) => {
        this.messages.set(messages); // Actualizează signal
      },
      error: (err) => {
        console.error('Error subscribing to conversation:', err);
      }
    });
  }

  send(): void {
    const contentValue = this.content().trim();
    const selectedId = this.selectedUserId();

    if (!contentValue || !selectedId) {
      return;
    }

    const msg: ChatMessageDto = {
      content: contentValue,
      receiverId: selectedId
    };

    this.chat.send(msg);
    this.content.set(''); // Resetează input-ul
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.chat.disconnect();
  }

  isMyMessage(message: ChatMessageDto): boolean {
    return message.senderId === this.currentUserId;
  }

  formatTime(timestamp: string | undefined): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
  }

  // Helper method pentru a actualiza unread count în lista de useri
  private updateUserUnreadCount(userId: number, count: number): void {
    const users = this.availableUsers();
    const updatedUsers = users.map(user =>
      user.userId === userId ? { ...user, unreadCount: count } : user
    );
    this.availableUsers.set(updatedUsers);
  }

  getFullImageUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl) return '/user.png';
    if (imageUrl.startsWith('/uploads/')) {
      return 'http://localhost:8080' + imageUrl;
    }
    return imageUrl;
  }
}
