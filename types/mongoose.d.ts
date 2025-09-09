import { Connection } from 'mongoose';

declare module 'mongoose' {
  interface Connection {
    modelSchemas?: Record<string, any>;
  }
}
