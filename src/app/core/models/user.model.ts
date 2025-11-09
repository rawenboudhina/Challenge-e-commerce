// src/app/models/user.model.ts
export interface User {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  address: string;
  password?: string;   // AJOUTE ÇA
  token?: string;
}