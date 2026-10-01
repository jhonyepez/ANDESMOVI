export interface AppleUserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
}

export const appleAuthService = {
  /**
   * Triggers official Apple OAuth 2.0 popup
   */
  async signInWithApple(customClientId?: string): Promise<AppleUserProfile> {
    const clientId = customClientId || import.meta.env.VITE_APPLE_CLIENT_ID || 'com.andesmovi.app';

    return new Promise((resolve, reject) => {
      const redirectUri = window.location.origin;
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      // Note: Apple Auth requires a POST request usually, but for popup flow with redirect_uri
      // we use the standard OAuth 2.0 endpoint.
      const authUrl =
        `https://appleid.apple.com/auth/authorize?` +
        `client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code%20id_token` +
        `&scope=${encodeURIComponent('name email')}` +
        `&response_mode=form_post`;

      const popup = window.open(
        authUrl,
        'AppleSignInPopup',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        reject(new Error('El navegador bloqueó la ventana emergente de Apple.'));
        return;
      }

      // Apple's form_post mode makes it hard to listen to hash. 
      // In production, you would handle the callback on your backend and return the user profile.
      // This is a simplified client-side mock/placeholder to match the flow.
      
      // Temporary simulation for the demo environment:
      setTimeout(() => {
        if (!popup.closed) popup.close();
        resolve({
          id: 'apple_' + Math.random().toString(36).substr(2, 9),
          email: 'usuario.apple@icloud.com',
          displayName: 'Usuario Apple',
          photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        });
      }, 3000);
    });
  },
};
