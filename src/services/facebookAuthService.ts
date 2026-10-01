export interface FacebookUserProfile {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
}

export const facebookAuthService = {
  /**
   * Triggers official Facebook OAuth 2.0 popup
   */
  async signInWithFacebook(customAppId?: string): Promise<FacebookUserProfile> {
    const appId = customAppId || import.meta.env.VITE_FACEBOOK_APP_ID || '849201849201842';

    return new Promise((resolve, reject) => {
      const redirectUri = window.location.origin;
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const authUrl =
        `https://www.facebook.com/v18.0/dialog/oauth?` +
        `client_id=${encodeURIComponent(appId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=token` +
        `&scope=${encodeURIComponent('email,public_profile')}`;

      const popup = window.open(
        authUrl,
        'FacebookSignInPopup',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        reject(new Error('El navegador bloqueó la ventana emergente de Facebook. Permite ventanas emergentes para continuar.'));
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
                fetch(
                  `https://graph.facebook.com/v18.0/me?fields=id,name,email,picture.width(400).height(400)&access_token=${accessToken}`
                )
                  .then((res) => res.json())
                  .then((info) => {
                    resolve({
                      id: info.id,
                      email: info.email || `${info.id}@facebook.com`,
                      displayName: info.name,
                      photoURL: info.picture?.data?.url || '',
                    });
                  })
                  .catch(reject);
              }
            }
          }
        } catch (e) {
          // Cross origin
        }
      }, 500);
    });
  },
};
