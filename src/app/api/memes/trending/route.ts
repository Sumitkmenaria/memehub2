import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || 'daily' // daily, weekly, monthly
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Calculate date range based on timeframe
    const now = new Date()
    let startDate: Date

    switch (timeframe) {
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'monthly':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default: // daily
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
    }

    // Get trending memes with sophisticated algorithm
    // Trending score = (upvotes - downvotes) * 2 + views * 0.1 + shareCount * 5 + recency_factor
    const trendingMemes = await prisma.$queryRaw`
      SELECT 
        m.*,
        u.username,
        u.displayName,
        u.avatar,
        COALESCE(v.upvotes, 0) as upvotes,
        COALESCE(v.downvotes, 0) as downvotes,
        COALESCE(m.views, 0) as views,
        COALESCE(m.shareCount, 0) as shareCount,
        COUNT(c.id) as comments,
        (
          (COALESCE(v.upvotes, 0) - COALESCE(v.downvotes, 0)) * 2 +
          COALESCE(m.views, 0) * 0.1 +
          COALESCE(m.shareCount, 0) * 5 +
          (
            CASE 
              WHEN m.createdAt > datetime('now', '-1 day') THEN 10
              WHEN m.createdAt > datetime('now', '-3 days') THEN 5
              WHEN m.createdAt > datetime('now', '-7 days') THEN 2
              ELSE 1
            END
          )
        ) as trending_score
      FROM memes m
      LEFT JOIN users u ON m.authorId = u.id
      LEFT JOIN (
        SELECT 
          memeId,
          SUM(CASE WHEN type = 'UPVOTE' THEN 1 ELSE 0 END) as upvotes,
          SUM(CASE WHEN type = 'DOWNVOTE' THEN 1 ELSE 0 END) as downvotes
        FROM votes
        GROUP BY memeId
      ) v ON m.id = v.memeId
      LEFT JOIN comments c ON m.id = c.memeId
      WHERE m.createdAt >= ${startDate.toISOString()}
      GROUP BY m.id
      ORDER BY trending_score DESC
      LIMIT ${limit} OFFSET ${skip}
    ` as any[]

    // Format the results to match expected structure
    const formattedMemes = trendingMemes.map(meme => ({
      id: meme.id,
      title: meme.title,
      description: meme.description,
      imageUrl: meme.imageUrl,
      memeType: meme.memeType,
      upvotes: parseInt(meme.upvotes) || 0,
      downvotes: parseInt(meme.downvotes) || 0,
      views: parseInt(meme.views) || 0,
      shareCount: parseInt(meme.shareCount) || 0,
      createdAt: meme.createdAt,
      author: {
        id: meme.authorId,
        username: meme.username,
        displayName: meme.displayName,
        avatar: meme.avatar,
      },
      _count: {
        comments: parseInt(meme.comments) || 0,
      },
      trendingScore: parseFloat(meme.trending_score) || 0,
    }))

    // Get total count for pagination
    const totalCount = await prisma.meme.count({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
    })

    return NextResponse.json({
      memes: formattedMemes,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
      },
      timeframe,
    })
  } catch (error) {
    console.error('Error fetching trending memes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trending memes' },
      { status: 500 }
    )
  }
}