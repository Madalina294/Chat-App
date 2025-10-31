export interface AuthenticationResponse{
  userId: number;
  userFirstName: string;
  userLastName: string;
  userRole: string;
  image?: string;
  preferredTheme?: string;
  preferredLanguage?: string;
  accessToken?: string;
  mfaEnabled?: boolean;
  qrCodeUrl?: string; // URL-ul QR code-ului pentru 2FA - RAPID!
  googleId?: string | null;
}
