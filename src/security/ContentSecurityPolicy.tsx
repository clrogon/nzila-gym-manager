import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';

interface ContentSecurityPolicyProps {
  nonce?: string;
}

const ContentSecurityPolicy: React.FC<ContentSecurityPolicyProps> = ({ nonce }) => {
  const cspDirectives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for some React/Vite dev features
      "'unsafe-eval'", // Required for some libraries
      "https://cdn.jsdelivr.net",
      "https://unpkg.com",
      "https://*.supabase.co",
      nonce ? `'nonce-${nonce}'` : '',
    ].filter(Boolean),
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for styled-components and emotion
      "https://fonts.googleapis.com",
      "https://cdn.jsdelivr.net",
    ],
    'img-src': [
      "'self'",
      "data:",
      "https:",
      "http:",
      "blob:",
      "https://*.supabase.co",
      "https://lh3.googleusercontent.com",
    ],
    'font-src': [
      "'self'",
      "https://fonts.gstatic.com",
      "https://cdn.jsdelivr.net",
    ],
    'connect-src': [
      "'self'",
      "https://*.supabase.co",
      "https://*.supabase.in",
      "ws://localhost:*", // For dev hot reload
      "wss://*.supabase.co",
    ],
    'frame-src': [
      "'self'",
      "https://*.supabase.co",
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'block-all-mixed-content': [],
    'upgrade-insecure-requests': [],
  };

  const cspString = Object.entries(cspDirectives)
    .map(([directive, sources]) => {
      if (sources.length === 0) return directive;
      return `${directive} ${sources.join(' ')}`;
    })
    .join('; ');

  return (
    <Helmet>
      <meta httpEquiv="Content-Security-Policy" content={cspString} />
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      <meta httpEquiv="X-Frame-Options" content="DENY" />
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
    </Helmet>
  );
};

export default ContentSecurityPolicy;
