/**
 * Strava API types
 */

export interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  athlete: StravaAthlete;
}

export interface StravaAthlete {
  id: number;
  username: string | null;
  firstname: string;
  lastname: string;
  profile_medium: string | null;
  profile: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  sex: string | null;
}

export interface StravaUploadResponse {
  id: number;
  id_str: string;
  external_id: string;
  status: string;
  error: string | null;
  upload_id: number;
  activity_id: number | null;
  name: string;
  description: string | null;
  trainer: boolean;
  commute: boolean;
  sport_type: string;
  private: boolean;
}

export interface StravaSession {
  id: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  athlete: {
    id: number;
    username: string | null;
    firstname: string;
    lastname: string;
  };
  createdAt: number;
  lastAccessedAt: number;
}

export interface StravaError {
  message: string;
  code?: string;
  field?: string;
}
