export interface GoogleUserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
  givenName?: string;
  familyName?: string;
}

declare global {
  interface Window {
    google?: any;
    FB?: any;
  }
}

export const googleAuthService = {
  /**
   * Triggers official Google OAuth 2.0 popup / GIS One Tap modal
   */
  async signInWithGoogle(customClientId?: string): Promise<GoogleUserProfile> {
    const clientId =
      customClientId ||
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      '1083748291039-andesmovi.apps.googleusercontent.com';

    return new Promise((resolve, reject) => {
      // 1. Try Google Identity Services (GIS) token client if window.google is available
      if (window.google?.accounts?.oauth2) {
        try {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'openid profile email',
            callback: async (tokenResponse: any) => {
              if (tokenResponse.error) {
                reject(
                  new Error(
                    tokenResponse.error_description || tokenResponse.error || 'Autenticación con Google cancelada'
                  )
                );
                return;
              }
              if (tokenResponse.access_token) {
                try {
                  const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                  });
                  if (!userInfoRes.ok) throw new Error('No se pudo obtener el perfil de Google');
                  const info = await userInfoRes.json();
                  resolve({
                    id: info.sub,
                    email: info.email,
                    displayName: info.name || `${info.given_name || ''} ${info.family_name || ''}`.trim(),
                    photoURL: info.picture,
                    givenName: info.given_name,
                    familyName: info.family_name,
                  });
                } catch (err) {
                  reject(err);
                }
              }
            },
            onerror: (err: any) => reject(err),
          });
          client.requestAccessToken({ prompt: 'select_account' });
          return;
        } catch (e) {
          console.warn('GIS init token client error, using popup fallback', e);
        }
      }

      // 2. Fallback: Official Google OAuth 2.0 Popup Window
      const redirectUri = window.location.origin;
      const width = 500;
      const height = 650;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=token` +
        `&scope=${encodeURIComponent('openid profile email')}` +
        `&prompt=select_account`;

      const popup = window.open(
        authUrl,
        'GoogleSignInPopup',
        `width=${width},height=${height},left=${left},top=${top},status=0,toolbar=0`
      );

      if (!popup) {
        reject(new Error('El navegador bloqueó la ventana emergente de Google. Permite ventanas emergentes para continuar.'));
        return;
      }

      const checkTimer = setInterval(() => {
        try {
          if (!popup || popup.closed) {
            clearInterval(checkTimer);
          }
          if (popup.location?.href && popup.location.href.includes(redirectUri)) {
            const hash = popup.location.hash;
            if (hash && hash.includes('access_token')) {
              clearInterval(checkTimer);
              popup.close();
              const params = new URLSearchParams(hash.replace('#', '?'));
              const accessToken = params.get('access_token');
              if (accessToken) {
                fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${accessToken}` },
                })
                  .then((res) => res.json())
                  .then((info) => {
                    resolve({
                      id: info.sub,
                      email: info.email,
                      displayName: info.name || `${info.given_name || ''} ${info.family_name || ''}`.trim(),
                      photoURL: info.picture,
                      givenName: info.given_name,
                      familyName: info.family_name,
                    });
                  })
                  .catch(reject);
              }
            }
          }
        } catch (e) {
          // Cross-origin restriction while popup is on accounts.google.com
        }
      }, 500);

      const handleMessage = async (event: MessageEvent) => {
        if (event.data?.type === 'GOOGLE_AUTH_TOKEN' && event.data.accessToken) {
          clearInterval(checkTimer);
          window.removeEventListener('message', handleMessage);
          try {
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${event.data.accessToken}` },
            });
            const info = await res.json();
            resolve({
              id: info.sub,
              email: info.email,
              displayName: info.name,
              photoURL: info.picture,
            });
          } catch (e) {
            reject(e);
          }
        }
      };

      window.addEventListener('message', handleMessage);
    });
  },
};
