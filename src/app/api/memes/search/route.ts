import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    if (!query || query.trim().length === 0) {
      return NextResponse.json({ 
        memes: [], 
        total: 0, 
        hasMore: false 
      })
    }

    const offset = (page - 1) * limit
    
    // Search memes by title, description, and tags
    const memes = await prisma.meme.findMany({
      where: {
        OR: [
          {
            title: {
              contains: query
            }
          },
          {
            description: {
              contains: query
            }
          },
          {
            tags: {
              some: {
                tag: {
                  name: {
                    contains: query
                  }
                }
              }
            }
          },
          {
            author: {
              OR: [
                {
                  username: {
                    contains: query
                  }
                },
                {
                  displayName: {
                    contains: query
                  }
                }
              ]
            }
          }
        ]
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
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
      },
      orderBy: [
        { createdAt: 'desc' }
      ],
      skip: offset,
      take: limit + 1 // Take one extra to check if there are more
    })

    // Check if there are more results
    const hasMore = memes.length > limit
    const resultMemes = hasMore ? memes.slice(0, limit) : memes

    // Get total count for pagination info
    const total = await prisma.meme.count({
      where: {
        OR: [
          {
            title: {
              contains: query
            }
          },
          {
            description: {
              contains: query
            }
          },
          {
            tags: {
              some: {
                tag: {
                  name: {
                    contains: query
                  }
                }
              }
            }
          },
          {
            author: {
              OR: [
                {
                  username: {
                    contains: query
                  }
                },
                {
                  displayName: {
                    contains: query
                  }
                }
              ]
            }
          }
        ]
      }
    })

    return NextResponse.json({
      memes: resultMemes,
      total,
      hasMore,
      query
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Failed to search memes' },
      { status: 500 }
    )
  }
}