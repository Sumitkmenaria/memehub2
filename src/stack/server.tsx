import { StackServerApp } from '@stackframe/stack'

export const stackServerApp = new StackServerApp({
  projectId: process.env.STACK_PROJECT_ID!,
  secretServerKey: process.env.STACK_SECRET_SERVER_KEY!,
  tokenStore: 'cookie',
})