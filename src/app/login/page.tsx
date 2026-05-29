'use client'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) router.push('/dashboard')
  }, [session, router])

  if (status === 'loading') return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-600 border-t-transparent" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-800 via-brand-600 to-brand-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md text-center">
        <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-9 h-9 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {process.env.NEXT_PUBLIC_AGENCY_NAME || 'Move Reports'}
        </h1>
        <p className="text-gray-400 text-sm mb-8">
          {process.env.NEXT_PUBLIC_AGENCY_TAGLINE || 'Business Intelligence'}
        </p>

        <p className="text-gray-600 text-sm mb-8 leading-relaxed">
          Conecte sua conta do Meta para gerar relatórios completos de todas as suas contas de anúncio automaticamente.
        </p>

        <button
          onClick={() => signIn('facebook', { callbackUrl: '/dashboard' })}
          className="w-full bg-[#1877F2] hover:bg-[#1664d8] text-white font-semibold py-3.5 px-6 rounded-xl transition-colors flex items-center justify-center gap-3 text-sm"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Entrar com Facebook / Meta
        </button>

        <p className="text-xs text-gray-400 mt-6">
          Permissões solicitadas: leitura de anúncios e insights. Seus dados são usados apenas para gerar relatórios.
        </p>
      </div>
    </div>
  )
}
