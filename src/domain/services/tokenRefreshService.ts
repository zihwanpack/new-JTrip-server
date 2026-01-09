import dotenv from 'dotenv';

const env = process.env.NODE_ENV || 'local';
dotenv.config({
  path: `.env.${env}`,
});

export interface RefreshTokenResult {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

export const TokenRefreshService = {
  /**
   * Google OAuth2 refresh token을 사용하여 새로운 access_token 발급
   */
  async refreshGoogleToken(
    refresh_token: string,
  ): Promise<RefreshTokenResult> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID as string,
          client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
          refresh_token: refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Google token refresh failed: ${JSON.stringify(errorData)}`,
        );
      }

      const data = await response.json();
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token || refresh_token, // 새 refresh_token이 없으면 기존 것 사용
        expires_in: data.expires_in,
      };
    } catch (error) {
      console.error('Error refreshing Google token:', error);
      throw error;
    }
  },

  /**
   * Kakao OAuth refresh token을 사용하여 새로운 access_token 발급
   */
  async refreshKakaoToken(
    refresh_token: string,
  ): Promise<RefreshTokenResult> {
    try {
      const response = await fetch('https://kauth.kakao.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: process.env.KAKAO_CLIENT_ID as string,
          refresh_token: refresh_token,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Kakao token refresh failed: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token || refresh_token, // 새 refresh_token이 없으면 기존 것 사용
        expires_in: data.expires_in,
      };
    } catch (error) {
      console.error('Error refreshing Kakao token:', error);
      throw error;
    }
  },

  /**
   * Naver OAuth refresh token을 사용하여 새로운 access_token 발급
   */
  async refreshNaverToken(
    refresh_token: string,
  ): Promise<RefreshTokenResult> {
    try {
      const response = await fetch('https://nid.naver.com/oauth2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: process.env.NAVER_CLIENT_ID as string,
          client_secret: process.env.NAVER_CLIENT_SECRET as string,
          refresh_token: refresh_token,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text().catch(() => '');
        throw new Error(`Naver token refresh failed: ${errorData}`);
      }

      const data = await response.json();
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token || refresh_token, // 새 refresh_token이 없으면 기존 것 사용
        expires_in: data.expires_in,
      };
    } catch (error) {
      console.error('Error refreshing Naver token:', error);
      throw error;
    }
  },

  /**
   * Provider에 따라 적절한 refresh 함수 호출
   */
  async refreshToken(
    provider: string,
    refresh_token: string,
  ): Promise<RefreshTokenResult> {
    switch (provider.toLowerCase()) {
      case 'google':
        return this.refreshGoogleToken(refresh_token);
      case 'kakao':
        return this.refreshKakaoToken(refresh_token);
      case 'naver':
        return this.refreshNaverToken(refresh_token);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  },
};

