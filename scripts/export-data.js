import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function exportData() {
  try {
    console.log('Exporting data from SQLite database...')
    
    const users = await prisma.user.findMany()
    const memes = await prisma.meme.findMany()
    const tags = await prisma.tag.findMany()
    const comments = await prisma.comment.findMany()
    const votes = await prisma.vote.findMany()
    const favorites = await prisma.favorite.findMany()
    const follows = await prisma.follow.findMany()
    const memeTags = await prisma.memeTag.findMany()
    const notifications = await prisma.notification.findMany()

    const exportData = {
      users,
      memes,
      tags,
      comments,
      votes,
      favorites,
      follows,
      memeTags,
      notifications,
      exportedAt: new Date().toISOString()
    }

    fs.writeFileSync('data-backup.json', JSON.stringify(exportData, null, 2))
    
    console.log('Data exported successfully to data-backup.json')
    console.log(`Exported ${users.length} users, ${memes.length} memes, ${comments.length} comments`)
    
  } catch (error) {
    console.error('Error exporting data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

exportData()