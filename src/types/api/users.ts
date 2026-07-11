export type UserRole = "OWNER" | "STAFF";

export interface ClubUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  /** True while the user is on a temporary password (created/reset by the owner). */
  mustChangePassword: boolean;
  createdAt: string;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  role?: UserRole;
}

/** The temp password is returned ONCE — show it to the owner immediately. */
export interface CreateUserResponse {
  user: ClubUser;
  tempPassword: string;
}

export interface UpdateUserRequest {
  name?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
