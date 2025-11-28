export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "coach" | "parent" | "player";
  teamId?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
