import { createBrowserClient } from '@supabase/ssr'

const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: {
          getItem: (key) => {
            if (typeof window === 'undefined') return null
            
            // Try to get from httpOnly cookies via API
            const cookies = document.cookie.split(';').reduce((acc, cookie) => {
              const [key, value] = cookie.trim().split('=')
              acc[key] = value
              return acc
            }, {} as Record<string, string>)
            
            return cookies[key] || null
          },
          setItem: async (key, value) => {
            if (typeof window === 'undefined') return
            
            try {
              // Set cookie via API endpoint for httpOnly flag
              await fetch('/api/auth/set-cookie', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ key, value }),
              })
            } catch (error) {
              console.error('Failed to set auth cookie:', error)
              // Fallback to localStorage ONLY for development
              if (process.env.NODE_ENV === 'development') {
                localStorage.setItem(key, value)
              }
            }
          },
          removeItem: (key) => {
            if (typeof window === 'undefined') return
            
            // Clear cookie via API
            fetch('/api/auth/clear-cookie', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ key }),
            }).catch(console.error)
            
            // Clear from localStorage if exists
            localStorage.removeItem(key)
          },
        },
        flowType: 'pkce',
      },
      cookies: {
        name: 'sb-auth',
        lifetime: 60 * 60 * 24 * 7, // 7 days
        domain: window.location.hostname,
        path: '/',
        sameSite: 'lax',
        secure: window.location.protocol === 'https:',
      },
    }
  )
}

export const supabase = createClient()
