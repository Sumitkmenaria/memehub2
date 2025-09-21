import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function importData() {
  try {
    console.log('Importing data to PostgreSQL database...')
    
    // Read the backup data
    const backupData = JSON.parse(fs.readFileSync('data-backup.json', 'utf8'))
    
    console.log(`Found backup with:`)
    console.log(`- ${backupData.users.length} users`)
    console.log(`- ${backupData.memes.length} memes`)
    console.log(`- ${backupData.tags.length} tags`)
    console.log(`- ${backupData.comments.length} comments`)
    console.log(`- ${backupData.votes.length} votes`)
    console.log(`- ${backupData.favorites.length} favorites`)
    console.log(`- ${backupData.follows.length} follows`)
    console.log(`- ${backupData.memeTags.length} meme tags`)
    console.log(`- ${backupData.notifications.length} notifications`)

    // Import in order to respect foreign key constraints
    
    // 1. Import users first
    for (const user of backupData.users) {
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          bio: user.bio,
          avatar: user.avatar,
          isAnonymous: user.isAnonymous,
          hashedPassword: user.hashedPassword,
          emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt)
        }
      })
    }
    console.log('✓ Users imported')

    // 2. Import tags
    for (const tag of backupData.tags) {
      await prisma.tag.create({
        data: {
          id: tag.id,
          name: tag.name
        }
      })
    }
    console.log('✓ Tags imported')

    // 3. Import memes
    for (const meme of backupData.memes) {
      await prisma.meme.create({
        data: {
          id: meme.id,
          title: meme.title,
          description: meme.description,
          imageUrl: meme.imageUrl,
          memeType: meme.memeType,
          upvotes: meme.upvotes,
          downvotes: meme.downvotes,
          views: meme.views,
          shareCount: meme.shareCount,
          authorId: meme.authorId,
          createdAt: new Date(meme.createdAt),
          updatedAt: new Date(meme.updatedAt)
        }
      })
    }
    console.log('✓ Memes imported')

    // 4. Import comments
    for (const comment of backupData.comments) {
      await prisma.comment.create({
        data: {
          id: comment.id,
          content: comment.content,
          userId: comment.userId,
          memeId: comment.memeId,
          createdAt: new Date(comment.createdAt),
          updatedAt: new Date(comment.updatedAt)
        }
      })
    }
    console.log('✓ Comments imported')

    // 5. Import votes
    for (const vote of backupData.votes) {
      await prisma.vote.create({
        data: {
          id: vote.id,
          type: vote.type,
          userId: vote.userId,
          memeId: vote.memeId
        }
      })
    }
    console.log('✓ Votes imported')

    // 6. Import favorites
    for (const favorite of backupData.favorites) {
      await prisma.favorite.create({
        data: {
          id: favorite.id,
          userId: favorite.userId,
          memeId: favorite.memeId,
          createdAt: new Date(favorite.createdAt)
        }
      })
    }
    console.log('✓ Favorites imported')

    // 7. Import follows
    for (const follow of backupData.follows) {
      await prisma.follow.create({
        data: {
          id: follow.id,
          followerId: follow.followerId,
          followingId: follow.followingId,
          createdAt: new Date(follow.createdAt)
        }
      })
    }
    console.log('✓ Follows imported')

    // 8. Import meme tags
    for (const memeTag of backupData.memeTags) {
      await prisma.memeTag.create({
        data: {
          id: memeTag.id,
          memeId: memeTag.memeId,
          tagId: memeTag.tagId
        }
      })
    }
    console.log('✓ Meme tags imported')

    // 9. Import notifications
    for (const notification of backupData.notifications) {
      await prisma.notification.create({
        data: {
          id: notification.id,
          type: notification.type,
          message: notification.message,
          isRead: notification.isRead,
          senderId: notification.senderId,
          receiverId: notification.receiverId,
          memeId: notification.memeId,
          commentId: notification.commentId,
          createdAt: new Date(notification.createdAt)
        }
      })
    }
    console.log('✓ Notifications imported')
    
    console.log('🎉 All data imported successfully to PostgreSQL!')
    
  } catch (error) {
    console.error('Error importing data:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

importData()