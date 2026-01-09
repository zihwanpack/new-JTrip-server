import { Route } from 'tsoa';

export interface UserResponse {
  id: string;
  email: string;
  nickname?: string;
  provider: string;
  profileImage?: string;
}

export interface AuthUserResponse {
  status: number;
  message: string;
  user: UserResponse;
}
