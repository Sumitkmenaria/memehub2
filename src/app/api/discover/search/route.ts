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

    const searchTerm = query.toLowerCase()
    
    // Search local database memes
    const localMemes = await prisma.meme.findMany({
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
      take: 50 // Get more results to filter and combine
    })

    // Fetch and search Imgflip templates
    let imgflipMemes: any[] = []
    try {
      const imgflipResponse = await fetch('https://api.imgflip.com/get_memes')
      if (imgflipResponse.ok) {
        const imgflipData = await imgflipResponse.json()
        if (imgflipData.success) {
          // Filter Imgflip memes that match the search query
          const filteredImgflip = imgflipData.data.memes.filter((meme: any) => 
            meme.name.toLowerCase().includes(searchTerm)
          )
          
          // Transform to our format
          imgflipMemes = filteredImgflip.map((meme: any) => ({
            id: `imgflip_${meme.id}`,
            title: meme.name,
            description: `Popular meme template from Imgflip - ${meme.box_count} text boxes`,
            imageUrl: meme.url,
            memeType: 'IMAGE' as const,
            upvotes: Math.floor(Math.random() * 1000) + 100,
            downvotes: Math.floor(Math.random() * 50),
            views: Math.floor(Math.random() * 10000) + 1000,
            shareCount: Math.floor(Math.random() * 100),
            createdAt: new Date().toISOString(),
            author: {
              id: 'imgflip_user',
              username: 'imgflip',
              displayName: 'Imgflip Templates',
              avatar: 'https://imgflip.com/s/img/logo_sm.png'
            },
            tags: [
              {
                tag: {
                  id: 'imgflip_tag',
                  name: 'imgflip'
                }
              },
              {
                tag: {
                  id: 'template_tag', 
                  name: 'template'
                }
              }
            ],
            _count: {
              comments: Math.floor(Math.random() * 50)
            },
            imgflip: {
              templateId: meme.id,
              width: meme.width,
              height: meme.height,
              boxCount: meme.box_count
            }
          }))
        }
      }
    } catch (imgflipError) {
      console.error('Error fetching Imgflip templates:', imgflipError)
      // Continue without Imgflip results
    }

    // Combine and sort results (prioritize local memes, then Imgflip templates)
    const combinedResults = [
      ...localMemes.map(meme => ({ ...meme, source: 'local' })),
      ...imgflipMemes.map(meme => ({ ...meme, source: 'imgflip' }))
    ]

    // Apply pagination
    const offset = (page - 1) * limit
    const paginatedResults = combinedResults.slice(offset, offset + limit)
    const hasMore = combinedResults.length > offset + limit

    return NextResponse.json({
      memes: paginatedResults,
      total: combinedResults.length,
      hasMore,
      query,
      sources: {
        local: localMemes.length,
        imgflip: imgflipMemes.length
      }
    })
  } catch (error) {
    console.error('Combined search error:', error)
    return NextResponse.json(
      { error: 'Failed to search memes and templates' },
      { status: 500 }
    )
  }
}