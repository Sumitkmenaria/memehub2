import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const memeType = formData.get('memeType') as 'IMAGE' | 'GIF' | 'VIDEO'
    const tagsJson = formData.get('tags') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Validate file type and size
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/mov'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      )
    }

    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large (max 50MB)' },
        { status: 400 }
      )
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const uniqueId = uuidv4()
    const fileName = `${uniqueId}.${fileExtension}`
    
    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Save file
    const filePath = join(uploadDir, fileName)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Parse tags
    let tags: string[] = []
    try {
      if (tagsJson) {
        tags = JSON.parse(tagsJson)
      }
    } catch (error) {
      // Invalid JSON, ignore tags
    }

    // Create meme in database
    const meme = await prisma.meme.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        imageUrl: `/uploads/${fileName}`,
        memeType,
        authorId: user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        },
        _count: {
          select: {
            comments: true
          }
        }
      }
    })

    // Create tags and associate with meme
    if (tags.length > 0) {
      for (const tagName of tags.slice(0, 10)) { // Limit to 10 tags
        if (tagName.trim()) {
          // Find or create tag
          const tag = await prisma.tag.upsert({
            where: { name: tagName.trim().toLowerCase() },
            update: {},
            create: { name: tagName.trim().toLowerCase() }
          })

          // Associate tag with meme
          await prisma.memeTag.create({
            data: {
              memeId: meme.id,
              tagId: tag.id
            }
          })
        }
      }
    }

    // Get meme with tags for response
    const memeWithTags = await prisma.meme.findUnique({
      where: { id: meme.id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        _count: {
          select: {
            comments: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Meme uploaded successfully',
      meme: memeWithTags
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}