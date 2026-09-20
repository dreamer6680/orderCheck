'use client'

import { useEffect } from 'react'

/** LocatorJS is enabled only in local development, never during SSR. */
export function LocatorJSDev() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    let active = true
    void import('@locator/runtime').then(({ default: setupLocatorUI }) => {
      if (active) setupLocatorUI()
    }).catch((error) => {
      console.error('LocatorJS failed to initialize:', error)
    })

    return () => {
      active = false
    }
  }, [])

  return null
}
