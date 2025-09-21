import { prisma } from '@/lib/db'

export type NotificationType = 'LIKE' | 'COMMENT' | 'FOLLOW' | 'MENTION' | 'SHARE'

interface CreateNotificationParams {
  type: NotificationType
  senderId?: string
  receiverId: string
  message: string
  memeId?: string
  commentId?: string
}

export async function createNotification({
  type,
  senderId,
  receiverId,
  message,
  memeId,
  commentId,
}: CreateNotificationParams) {
  try {
    // Don't send notification to yourself
    if (senderId === receiverId) {
      return
    }

    // Check if a similar notification already exists (to avoid spam)
    const existingNotification = await prisma.notification.findFirst({
      where: {
        type,
        senderId,
        receiverId,
        memeId,
        commentId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Within last 24 hours
        },
      },
    })

    if (existingNotification) {
      return // Don't create duplicate notification
    }

    const notification = await prisma.notification.create({
      data: {
        type,
        senderId,
        receiverId,
        message,
        memeId,
        commentId,
      },
    })

    return notification
  } catch (error) {
    console.error('Error creating notification:', error)
  }
}

export async function notifyOnVote(
  senderId: string,
  memeId: string,
  voteType: 'UPVOTE' | 'DOWNVOTE'
) {
  try {
    const meme = await prisma.meme.findUnique({
      where: { id: memeId },
      include: {
        author: true,
      },
    })

    if (!meme || meme.authorId === senderId) return

    const sender = await prisma.user.findUnique({
      where: { id: senderId },
    })

    if (!sender) return

    const message = voteType === 'UPVOTE' 
      ? `${sender.displayName || sender.username} liked your meme "${meme.title}"`
      : `${sender.displayName || sender.username} disliked your meme "${meme.title}"`

    await createNotification({
      type: 'LIKE',
      senderId,
      receiverId: meme.authorId,
      message,
      memeId,
    })
  } catch (error) {
    console.error('Error creating vote notification:', error)
  }
}

export async function notifyOnComment(
  senderId: string,
  memeId: string,
  commentId: string
) {
  try {
    const meme = await prisma.meme.findUnique({
      where: { id: memeId },
      include: {
        author: true,
      },
    })

    if (!meme || meme.authorId === senderId) return

    const sender = await prisma.user.findUnique({
      where: { id: senderId },
    })

    if (!sender) return

    const message = `${sender.displayName || sender.username} commented on your meme "${meme.title}"`

    await createNotification({
      type: 'COMMENT',
      senderId,
      receiverId: meme.authorId,
      message,
      memeId,
      commentId,
    })
  } catch (error) {
    console.error('Error creating comment notification:', error)
  }
}

export async function notifyOnFollow(senderId: string, receiverId: string) {
  try {
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
    })

    if (!sender) return

    const message = `${sender.displayName || sender.username} started following you`

    await createNotification({
      type: 'FOLLOW',
      senderId,
      receiverId,
      message,
    })
  } catch (error) {
    console.error('Error creating follow notification:', error)
  }
}

export async function notifyOnShare(senderId: string, memeId: string) {
  try {
    const meme = await prisma.meme.findUnique({
      where: { id: memeId },
      include: {
        author: true,
      },
    })

    if (!meme || meme.authorId === senderId) return

    const sender = await prisma.user.findUnique({
      where: { id: senderId },
    })

    if (!sender) return

    const message = `${sender.displayName || sender.username} shared your meme "${meme.title}"`

    await createNotification({
      type: 'SHARE',
      senderId,
      receiverId: meme.authorId,
      message,
      memeId,
    })
  } catch (error) {
    console.error('Error creating share notification:', error)
  }
}