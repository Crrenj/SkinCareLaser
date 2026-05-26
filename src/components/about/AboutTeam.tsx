import { getTranslations } from 'next-intl/server'
import { AboutSectionHead } from './AboutSectionHead'

export async function AboutTeam() {
  const t = await getTranslations('About.team')

  return (
    <section className="bg-sand-50 px-6 lg:px-10 py-20 lg:py-[120px] border-b border-sand-300">
      <div className="max-w-[1320px] mx-auto">
        <AboutSectionHead
          num={t('num')}
          eyebrow={t('eyebrow')}
          titleHtml={t.raw('title') as string}
          lede={t('lede')}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr] gap-6">
          <Member
            lead
            label={t('leadLabel')}
            role={t('leadRole')}
            name={t('leadName')}
            creds={t('leadCreds')}
            quote={t('leadQuote')}
            gradId="aboutTeamLead"
            stops={['#F0D7C5', '#CCC5BD']}
            tagBlocks
          />
          <Member
            label={t('m2Label')}
            role={t('m2Role')}
            name={t('m2Name')}
            creds={t('m2Creds')}
            quote={t('m2Quote')}
            gradId="aboutTeamM2"
            stops={['#EDEAE5', '#D8D1C6']}
            silhouetteFill="#9A9388"
            silhouetteOpacity={0.5}
            bodyFill="#807969"
            bodyOpacity={0.5}
          />
          <Member
            label={t('m3Label')}
            role={t('m3Role')}
            name={t('m3Name')}
            creds={t('m3Creds')}
            quote={t('m3Quote')}
            gradId="aboutTeamM3"
            stops={['#F4EFE7', '#CCC5BD']}
            silhouetteFill="#807969"
            silhouetteOpacity={0.55}
            bodyFill="#5A5448"
            bodyOpacity={0.4}
          />
        </div>
      </div>
    </section>
  )
}

type MemberProps = {
  label: string
  role: string
  name: string
  creds: string
  quote: string
  gradId: string
  stops: [string, string]
  lead?: boolean
  silhouetteFill?: string
  silhouetteOpacity?: number
  bodyFill?: string
  bodyOpacity?: number
  /** Affiche le badge "FOTO retrato editorial" dans le coin (lead seulement). */
  tagBlocks?: boolean
}

function Member({
  label,
  role,
  name,
  creds,
  quote,
  gradId,
  stops,
  lead = false,
  silhouetteFill = '#9A9388',
  silhouetteOpacity = 0.5,
  bodyFill = '#807969',
  bodyOpacity = 0.45,
  tagBlocks = false,
}: MemberProps) {
  return (
    <article
      className={`bg-sand-50 border border-sand-300 rounded-[4px] overflow-hidden flex flex-col ${
        lead ? 'md:col-span-2 lg:col-span-1' : ''
      }`}
    >
      <div
        className={`relative overflow-hidden ${lead ? 'aspect-[16/11]' : 'aspect-[4/5]'}`}
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,.45), transparent 55%), linear-gradient(180deg, var(--color-sand-200), var(--color-sand-300))',
        }}
      >
        <span className="absolute left-4 top-4 z-10 font-mono text-[10px] tracking-[0.16em] uppercase text-ink-700 bg-sand-50/85 backdrop-blur-sm px-2.5 py-1 rounded-[2px]">
          {label}
        </span>
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox={lead ? '0 0 600 420' : '0 0 400 500'}
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
        >
          <defs>
            <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={stops[0]} />
              <stop offset="100%" stopColor={stops[1]} />
            </linearGradient>
          </defs>
          {lead ? (
            <>
              <rect width="600" height="420" fill={`url(#${gradId})`} />
              <ellipse cx="300" cy="180" rx="90" ry="105" fill={silhouetteFill} opacity={silhouetteOpacity} />
              <ellipse cx="300" cy="430" rx="190" ry="180" fill={bodyFill} opacity={bodyOpacity} />
              <path d="M 200 420 L 250 320 L 300 350 L 350 320 L 400 420 Z" fill="#FBF8F4" opacity="0.85" />
              {tagBlocks && (
                <>
                  <rect
                    x="380"
                    y="38"
                    width="120"
                    height="46"
                    rx="2"
                    fill="rgba(251,248,244,.7)"
                    stroke="#5A5448"
                    strokeWidth="0.8"
                  />
                  <text
                    x="440"
                    y="60"
                    textAnchor="middle"
                    fontFamily="JetBrains Mono"
                    fontSize="10"
                    fill="#5A5448"
                    letterSpacing="2"
                  >
                    FOTO
                  </text>
                  <text
                    x="440"
                    y="74"
                    textAnchor="middle"
                    fontFamily="Instrument Serif"
                    fontStyle="italic"
                    fontSize="13"
                    fill="#8E5232"
                  >
                    retrato editorial
                  </text>
                </>
              )}
            </>
          ) : (
            <>
              <rect width="400" height="500" fill={`url(#${gradId})`} />
              <ellipse cx="200" cy="195" rx="78" ry="92" fill={silhouetteFill} opacity={silhouetteOpacity} />
              <ellipse cx="200" cy="525" rx="170" ry="180" fill={bodyFill} opacity={bodyOpacity} />
              <path d="M 110 500 L 160 380 L 200 410 L 240 380 L 290 500 Z" fill="#FBF8F4" opacity="0.85" />
            </>
          )}
        </svg>
      </div>
      <div className="px-6 pt-6 pb-7 flex-1 flex flex-col">
        <div className="font-mono text-[10.5px] tracking-[0.14em] uppercase text-clay-700 mb-2.5">
          {role}
        </div>
        <h3
          className={`font-serif leading-[1.05] -tracking-[0.012em] text-ink-900 mb-2.5 ${
            lead ? 'text-[38px]' : 'text-[30px]'
          }`}
        >
          {name}
        </h3>
        <p className="text-[13px] leading-[1.5] text-ink-700 mb-4">{creds}</p>
        <p className="font-serif italic text-[17px] leading-[1.45] text-ink-800 pt-4 mt-auto border-t border-sand-300">
          «&nbsp;{quote}&nbsp;»
        </p>
      </div>
    </article>
  )
}
