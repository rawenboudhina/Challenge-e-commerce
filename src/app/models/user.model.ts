// CE FICHIER DOIT ÊTRE LE SEUL À CONTENIR CES INTERFACES

export interface User {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  address: string;
  addresses?: string[];
  password?: string;
  token?: string;
}

export interface UserPayload extends Omit<User, 'password'> {
  token: string;
}
