import { ObjectId } from 'mongodb';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      MONGODB_URI: string;
      MONGODB_DB: string;
      NEXTAUTH_SECRET: string;
      NEXTAUTH_URL: string;
    }
  }
}

export interface AdminProfile {
  _id?: ObjectId;
  companyName: string;
  adminName: string;
  email: string;
  password: string;
  logo?: string;
  createdAt: Date;
  updatedAt: Date;
}
