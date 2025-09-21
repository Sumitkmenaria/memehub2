import 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    email: string
    username: string
    displayName?: string | null
    avatar?: string | null
  }

  interface Session {
    user: {
      id: string
      email: string
      username: string
      displayName?: string | null
      avatar?: string | null
      name?: string | null
      image?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    username?: string
    displayName?: string | null
    avatar?: string | null
  }
}