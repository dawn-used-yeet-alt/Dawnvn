import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const title = searchParams.get('title') || 'Visual Novel';
    const coverUrl = searchParams.get('cover') || '';

    // VN Params
    const rating = searchParams.get('rating');
    const votecount = searchParams.get('votes') || '0';
    const lengthMinutes = searchParams.get('lengthMinutes') || '';
    const released = searchParams.get('released') || '';

    // Character Params
    const age = searchParams.get('age');
    const height = searchParams.get('height');
    const bloodType = searchParams.get('blood_type');
    const bust = searchParams.get('bust');
    const waist = searchParams.get('waist');
    const hips = searchParams.get('hips');
    const cup = searchParams.get('cup');
    const birthday = searchParams.get('birthday');

    const tagsParam = searchParams.get('tags') || '';
    const tags = tagsParam ? tagsParam.split(',') : [];

    const ratingScore = rating ? (parseFloat(rating) / 10).toFixed(1) : null;
    const hours = lengthMinutes ? Math.round(parseInt(lengthMinutes) / 60) : null;

    // Get vote count without any special characters
    const cleanVoteCount = votecount.replace(/[^\d]/g, '');

    // Adjust title size based on length
    const titleLength = title.length;
    const titleFontSize = titleLength > 40 ? '48px' : titleLength > 25 ? '56px' : '64px';
    const titleMaxLength = titleLength > 60 ? 60 : titleLength > 50 ? 55 : 100;
    const displayTitle = title.length > titleMaxLength ? title.substring(0, titleMaxLength - 3) + '...' : title;

    // Determine if we are showing character stats
    const isCharacter = age || height || bloodType || bust || birthday;

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            background: '#0a0a0a',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background Layer - Original Cover (below blur) */}
          {coverUrl && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
              }}
            >
              <img
                src={coverUrl}
                alt="Background"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: 'brightness(0.3)',
                }}
              />
            </div>
          )}

          {/* Blur Layer - Cropped Cover (on top of background) */}
          {coverUrl && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
              }}
            >
              <img
                src={coverUrl}
                alt="Cover"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  filter: 'blur(18px) brightness(0.47)',
                  transform: 'scale(1.1)',
                }}
              />
              {/* Dark gradient overlay */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(to right, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,0.7) 100%)',
                  display: 'flex',
                }}
              />
            </div>
          )}

          {/* Content Container */}
          <div
            style={{
              display: 'flex',
              width: '100%',
              height: '100%',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Left Side - Cover */}
            {coverUrl && (
              <div
                style={{
                  width: '420px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '60px 40px',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '480px',
                    display: 'flex',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <img
                    src={coverUrl}
                    alt="Cover"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Right Side - Info */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '60px',
                paddingLeft: coverUrl ? '40px' : '80px',
                gap: '28px',
              }}
            >
              {/* Title */}
              <div
                style={{
                  fontSize: titleFontSize,
                  fontWeight: 'bold',
                  color: '#ffffff',
                  lineHeight: '1.1',
                  display: 'flex',
                  letterSpacing: '-0.02em',
                  textShadow: '0 2px 20px rgba(0, 0, 0, 0.8)',
                }}
              >
                {displayTitle}
              </div>

              {/* Stats Row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '32px',
                  flexWrap: 'wrap',
                }}
              >
                {!isCharacter ? (
                  /* VN Stats */
                  <>
                    {ratingScore && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '72px',
                            fontWeight: 'bold',
                            color: '#fbbf24',
                            display: 'flex',
                            lineHeight: 1,
                          }}
                        >
                          {ratingScore}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '16px',
                              color: '#94a3b8',
                              display: 'flex',
                            }}
                          >
                            {cleanVoteCount} votes
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Divider */}
                    {ratingScore && (hours || released) && (
                      <div
                        style={{
                          width: '2px',
                          height: '60px',
                          background: 'rgba(255, 255, 255, 0.15)',
                          display: 'flex',
                        }}
                      />
                    )}

                    {/* Meta Info */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      {hours !== null && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '24px',
                              color: '#e2e8f0',
                              display: 'flex',
                            }}
                          >
                            📚
                          </div>
                          <div
                            style={{
                              fontSize: '20px',
                              color: '#e2e8f0',
                              fontWeight: '600',
                              display: 'flex',
                            }}
                          >
                            {hours}h reading time
                          </div>
                        </div>
                      )}
                      {released && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '24px',
                              color: '#e2e8f0',
                              display: 'flex',
                            }}
                          >
                            📅
                          </div>
                          <div
                            style={{
                              fontSize: '20px',
                              color: '#e2e8f0',
                              fontWeight: '600',
                              display: 'flex',
                            }}
                          >
                            Released {released}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  /* Character Stats */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                      {age && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '20px', color: '#94a3b8' }}>Age</span>
                          <span style={{ fontSize: '24px', color: '#e2e8f0', fontWeight: '600' }}>{age}</span>
                        </div>
                      )}
                      {birthday && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '20px', color: '#94a3b8' }}>Born</span>
                          <span style={{ fontSize: '24px', color: '#e2e8f0', fontWeight: '600' }}>{birthday}</span>
                        </div>
                      )}
                      {height && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '20px', color: '#94a3b8' }}>Height</span>
                          <span style={{ fontSize: '24px', color: '#e2e8f0', fontWeight: '600' }}>{height}cm</span>
                        </div>
                      )}
                      {bloodType && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '20px', color: '#94a3b8' }}>Blood</span>
                          <span style={{ fontSize: '24px', color: '#e2e8f0', fontWeight: '600' }}>{bloodType}</span>
                        </div>
                      )}
                    </div>

                    {(bust || waist || hips) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '20px', color: '#94a3b8' }}>Measurements:</span>
                        <span style={{ fontSize: '22px', color: '#fff', fontWeight: 'bold' }}>
                          B{bust || '?'} / W{waist || '?'} / H{hips || '?'}
                          {cup && ` (${cup})`}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    flexWrap: 'wrap',
                    maxWidth: '700px',
                    maxHeight: '160px', // Approx 3 lines
                    overflow: 'hidden',
                  }}
                >
                  {tags.map((tag, index) => {
                    // Clean the tag - remove HTML entities and trim
                    const cleanTag = tag
                      .replace(/&[^;]+;/g, '')
                      .replace(/<[^>]*>/g, '')
                      .trim();

                    return (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          background: 'rgba(99, 102, 241, 0.2)',
                          border: '2px solid rgba(99, 102, 241, 0.5)',
                          padding: '8px 20px',
                          borderRadius: '24px',
                          backdropFilter: 'blur(10px)',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '18px',
                            color: '#c7d2fe',
                            fontWeight: '600',
                            display: 'flex',
                          }}
                        >
                          {cleanTag}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Footer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginTop: 'auto',
                }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#6366f1',
                    display: 'flex',
                  }}
                />
                <div
                  style={{
                    fontSize: '18px',
                    color: '#64748b',
                    fontWeight: '700',
                    letterSpacing: '0.1em',
                    display: 'flex',
                  }}
                >
                  Sister Sex
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.error('Error generating OG image:', e);
    return new Response(`Failed to generate image: ${e.message}`, {
      status: 500,
    });
  }
}
