export type User = {
  _id: string;
  email: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
};

/** Ответ GET /api/users (пагинация) */
export type UsersResponse = {
  users: User[];
  total: number;
  page: number;
  limit: number;
};

export type AuthResponse = {
  token: string;
  user: User;
};
