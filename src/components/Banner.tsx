'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'

interface BannerProps {
  id: string
  title: string
  description: string
  imageUrl: string
  linkUrl?: string
  linkText?: string
  bannerType: 'image_left' | 'image_right' | 'image_full' | 'card_style' | 'minimal' | 'gradient_overlay'
  onView?: (id: string) => void
  onClick?: (id: string) => void
}

export default function Banner({
  id,
  title,
  description,
  imageUrl,
  linkUrl,
  linkText,
  bannerType,
  onView,
  onClick
}: BannerProps) {
  const [imageLoaded, setImageLoaded] = useState(false)

  // Appeler onView quand le composant est monté
  useEffect(() => {
    if (onView) {
      onView(id)
    }
  }, [id, onView])

  const handleClick = () => {
    if (onClick) {
      onClick(id)
    }
  }

  const renderContent = () => (
    <div className="flex-1 flex flex-col justify-center space-y-4">
      <h3 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
        {title}
      </h3>
      <p className="text-lg text-gray-700 leading-relaxed">
        {description}
      </p>
      {linkUrl && linkText && (
        <div>
          <Link
            href={linkUrl}
            onClick={handleClick}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            {linkText}
            <svg
              className="ml-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      )}
    </div>
  )

  const renderImage = () => (
    <div className="relative w-full max-w-xs h-64 md:h-72 overflow-hidden rounded-lg shadow-md">
      <Image
        src={imageUrl}
        alt={title}
        fill
        className={`object-cover transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setImageLoaded(true)}
        sizes="(max-width: 768px) 100vw, 300px"
        priority
      />
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="text-gray-400">Chargement...</div>
        </div>
      )}
    </div>
  )

  // Style image à gauche
  if (bannerType === 'image_left') {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[320px] gap-4">
          <div className="flex items-center justify-center p-6 bg-gray-50">
            {renderImage()}
          </div>
          <div className="flex items-center p-6 md:p-8">
            {renderContent()}
          </div>
        </div>
      </div>
    )
  }

  // Style image à droite
  if (bannerType === 'image_right') {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[320px] gap-4">
          <div className="flex items-center p-6 md:p-8">
            {renderContent()}
          </div>
          <div className="flex items-center justify-center p-6 bg-gray-50">
            {renderImage()}
          </div>
        </div>
      </div>
    )
  }

  // Style image pleine largeur
  if (bannerType === 'image_full') {
    return (
      <div className="relative w-full h-96 md:h-[500px] rounded-xl overflow-hidden shadow-lg mb-8">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className={`object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          sizes="100vw"
          priority
        />
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <div className="text-gray-400">Chargement...</div>
          </div>
        )}
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent" />
        
        {/* Contenu superposé */}
        <div className="absolute inset-0 flex items-center justify-start p-6 md:p-12">
          <div className="max-w-2xl text-white">
            <h3 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
              {title}
            </h3>
            <p className="text-lg md:text-xl mb-6 leading-relaxed opacity-90">
              {description}
            </p>
            {linkUrl && linkText && (
              <Link
                href={linkUrl}
                onClick={handleClick}
                className="inline-flex items-center px-8 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                {linkText}
                <svg
                  className="ml-2 h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Style carte (card_style)
  if (bannerType === 'card_style') {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8 max-w-md mx-auto">
        <div className="relative h-48">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className={`object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            sizes="400px"
            priority
          />
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
              <div className="text-gray-400">Chargement...</div>
            </div>
          )}
        </div>
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
            {title}
          </h3>
          <p className="text-gray-600 mb-4 leading-relaxed">
            {description}
          </p>
          {linkUrl && linkText && (
            <Link
              href={linkUrl}
              onClick={handleClick}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              {linkText}
              <svg
                className="ml-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          )}
        </div>
      </div>
    )
  }

  // Style minimal
  if (bannerType === 'minimal') {
    return (
      <div className="bg-gray-50 rounded-xl p-8 mb-8 border-l-4 border-blue-500">
        <div className="flex items-start space-x-6">
          <div className="relative w-16 h-16 flex-shrink-0">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className={`object-cover rounded-full transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              sizes="64px"
              priority
            />
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-full flex items-center justify-center">
                <div className="text-gray-400 text-xs">...</div>
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </h3>
            <p className="text-gray-600 mb-3 text-sm leading-relaxed">
              {description}
            </p>
            {linkUrl && linkText && (
              <Link
                href={linkUrl}
                onClick={handleClick}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors duration-200"
              >
                {linkText} →
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Style gradient overlay
  if (bannerType === 'gradient_overlay') {
    return (
      <div className="relative w-full h-80 rounded-xl overflow-hidden shadow-lg mb-8">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className={`object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          sizes="100vw"
          priority
        />
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <div className="text-gray-400">Chargement...</div>
          </div>
        )}
        
        {/* Overlay gradient du bas */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* Contenu en bas */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="text-white">
            <h3 className="text-2xl md:text-3xl font-bold mb-3 leading-tight">
              {title}
            </h3>
            <p className="text-lg mb-4 leading-relaxed opacity-90">
              {description}
            </p>
            {linkUrl && linkText && (
              <Link
                href={linkUrl}
                onClick={handleClick}
                className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-lg hover:bg-white/30 transition-all duration-200 border border-white/30"
              >
                {linkText}
                <svg
                  className="ml-2 h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
} 