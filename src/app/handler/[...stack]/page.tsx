import { stackServerApp } from '@/stack/server'
import { StackHandler } from '@stackframe/stack'

export default function Handler() {
  return <StackHandler app={stackServerApp} fullPage={true} />
}