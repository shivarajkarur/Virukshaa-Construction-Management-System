// Type declarations for next-auth
// This file helps TypeScript find the next-auth module declarations

declare module 'next-auth/react' {
  export * from 'next-auth';
  
  // Re-export specific hooks and components
  export { useSession } from 'next-auth/react';
  export { SessionProvider } from 'next-auth/react';
  export { signIn, signOut } from 'next-auth/react';
  export { getSession } from 'next-auth/react';
  export { getCsrfToken } from 'next-auth/react';
  export { getProviders } from 'next-auth/react';
}

declare module 'next-auth' {
  // This ensures the main next-auth module is also recognized
  export * from 'next-auth';
}