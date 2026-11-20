import React, { useId } from 'react'
import type { OrigemNoticia } from '@/lib/social-origem'

interface IconePlataformaProps {
  origem: 'instagram' | 'youtube'
  tamanho?: number
  decorativo?: boolean
}

/**
 * Logotipos vetoriais minimalistas oficiais do Instagram e YouTube.
 * Mantém proporções oficiais, alta nitidez vetorial e suporte acessível.
 */
export function IconePlataforma({
  origem,
  tamanho = 18,
  decorativo = false,
}: IconePlataformaProps) {
  const gradId = useId().replace(/:/g, '')

  if (origem === 'youtube') {
    const altura = Math.round(tamanho * 0.72)
    return (
      <svg
        width={tamanho}
        height={altura}
        viewBox="0 0 28 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden={decorativo ? 'true' : undefined}
        role={decorativo ? undefined : 'img'}
        aria-label={decorativo ? undefined : 'Conteúdo do YouTube'}
        style={{ display: 'block', flexShrink: 0 }}
      >
        <path
          d="M27.42 3.12a3.52 3.52 0 0 0-2.48-2.49C22.75 0 14 0 14 0S5.25 0 3.06.63A3.52 3.52 0 0 0 .58 3.12 36.8 36.8 0 0 0 0 10a36.8 36.8 0 0 0 .58 6.88 3.52 3.52 0 0 0 2.48 2.49C5.25 20 14 20 14 20s8.75 0 10.94-.63a3.52 3.52 0 0 0 2.48-2.49A36.8 36.8 0 0 0 28 10a36.8 36.8 0 0 0-.58-6.88Z"
          fill="#FF0000"
        />
        <path d="M11.2 14.29 18.47 10 11.2 5.71v8.58Z" fill="#FFFFFF" />
      </svg>
    )
  }

  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={decorativo ? 'true' : undefined}
      role={decorativo ? undefined : 'img'}
      aria-label={decorativo ? undefined : 'Conteúdo do Instagram'}
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        <radialGradient id={`ig-grad-${gradId}`} cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#FDF497" />
          <stop offset="10%" stopColor="#FDF497" />
          <stop offset="45%" stopColor="#FD5949" />
          <stop offset="65%" stopColor="#D6249F" />
          <stop offset="95%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect x="1.5" y="1.5" width="21" height="21" rx="5.5" fill={`url(#ig-grad-${gradId})`} />
      <rect
        x="5.75"
        y="5.75"
        width="12.5"
        height="12.5"
        rx="3.4"
        stroke="#FFFFFF"
        strokeWidth="1.75"
      />
      <circle cx="12" cy="12" r="3.1" stroke="#FFFFFF" strokeWidth="1.75" />
      <circle cx="15.8" cy="8.2" r="1.05" fill="#FFFFFF" />
    </svg>
  )
}

interface SeloOrigemSocialProps {
  origem: OrigemNoticia
  variante?: 'card' | 'hero' | 'inline'
}

/**
 * Selo minimalista de identificação visual da origem (Instagram ou YouTube).
 * Substitui badges textuais por logotipos vetoriais consistentes e acessíveis.
 */
export default function SeloOrigemSocial({
  origem,
  variante = 'card',
}: SeloOrigemSocialProps) {
  if (origem !== 'instagram' && origem !== 'youtube') return null

  const labelAcessivel =
    origem === 'instagram' ? 'Publicação do Instagram' : 'Vídeo do YouTube'

  if (variante === 'inline') {
    return (
      <span
        role="img"
        aria-label={labelAcessivel}
        title={labelAcessivel}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '28px',
          height: '28px',
          borderRadius: '7px',
          background: '#ffffff',
          border: '1px solid #e4dce0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          flexShrink: 0,
        }}
      >
        <IconePlataforma origem={origem} tamanho={origem === 'youtube' ? 19 : 17} decorativo />
      </span>
    )
  }

  const isHero = variante === 'hero'
  const caixa = isHero ? 36 : 30
  const iconeTam = isHero ? (origem === 'youtube' ? 22 : 20) : origem === 'youtube' ? 19 : 17

  return (
    <span
      role="img"
      aria-label={labelAcessivel}
      title={labelAcessivel}
      style={{
        position: 'absolute',
        top: isHero ? '14px' : '10px',
        right: isHero ? '14px' : '10px',
        width: `${caixa}px`,
        height: `${caixa}px`,
        borderRadius: '8px',
        background: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(48, 37, 42, 0.12)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.22)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
        pointerEvents: 'none',
      }}
    >
      <IconePlataforma origem={origem} tamanho={iconeTam} decorativo />
    </span>
  )
}
