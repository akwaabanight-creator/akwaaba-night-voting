'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Category = {
  id: string
  name: string
  description: string | null
  is_active: boolean
}

type Nominee = {
  id: string
  category_id: string
  name: string
  description: string | null
  is_active: boolean
}

export default function AdminDashboard() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [nominees, setNominees] = useState<Nominee[]>([])

  useEffect(() => {
    async function loadDashboard() {
      const supabase = createClient()

      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser()

        if (authError || !authData.user) {
          router.replace('/admin/login')
          return
        }

        setEmail(authData.user.email ?? '')

        const { data: role, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authData.user.id)
          .maybeSingle()

        if (roleError || role?.role !== 'admin') {
          await supabase.auth.signOut()
          router.replace('/admin/login')
          return
        }

        const [categoryResult, nomineeResult] = await Promise.all([
          supabase
            .from('categories')
            .select('id, name, description, is_active')
            .order('name'),

          supabase
            .from('nominees')
            .select('id, category_id, name, description, is_active')
            .order('name'),
        ])

        if (categoryResult.error) throw categoryResult.error
        if (nomineeResult.error) throw nomineeResult.error

        setCategories(categoryResult.data ?? [])
        setNominees(nomineeResult.data ?? [])
      } catch {
        setError(
          'We could not load the dashboard. Please refresh and try again.'
        )
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [router])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/admin/login')
    router.refresh()
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p>Loading administrator dashboard...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Akwaaba Night
            </h1>
            <p className="mt-1 text-slate-600">
              Administrator Dashboard
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 font-medium"
          >
            Sign out
          </button>
        </header>

        <section className="mb-8 rounded-xl border border-amber-300 bg-amber-50 p-5">
          <h2 className="font-bold text-amber-900">
            Preview mode
          </h2>
          <p className="mt-2 text-sm text-amber-900">
            Voting and payments are disabled. This dashboard is for
            administration and award-list management only.
          </p>
        </section>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg bg-red-100 p-4 text-red-800"
          >
            {error}
          </div>
        )}

        <section className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Award categories</p>
            <p className="mt-2 text-3xl font-bold">{categories.length}</p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">Nominees</p>
            <p className="mt-2 text-3xl font-bold">{nominees.length}</p>
          </div>
        </section>

        <section className="mb-8 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-bold">Administrator account</h2>
          <p className="break-all text-slate-600">{email}</p>
          <p className="mt-2 text-sm font-medium text-green-700">
            Administrator role verified
          </p>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold">Award categories and nominees</h2>

          {categories.length === 0 && (
            <p className="text-slate-600">
              No categories were returned by the database.
            </p>
          )}

          <div className="space-y-6">
            {categories.map((category) => {
              const categoryNominees = nominees.filter(
                (nominee) => nominee.category_id === category.id
              )

              return (
                <article
                  key={category.id}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-bold text-slate-900">
                      {category.name}
                    </h3>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        category.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {category.is_active ? 'Published' : 'Unpublished'}
                    </span>
                  </div>

                  {category.description && (
                    <p className="mt-2 text-sm text-slate-600">
                      {category.description}
                    </p>
                  )}

                  <p className="mt-4 text-sm font-semibold text-slate-700">
                    Nominees ({categoryNominees.length})
                  </p>

                  {categoryNominees.length > 0 ? (
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {categoryNominees.map((nominee) => (
                        <li key={nominee.id} className="text-slate-700">
                          {nominee.name}
                          {!nominee.is_active && (
                            <span className="ml-2 text-xs text-slate-500">
                              (Unpublished)
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">
                      No nominees found for this category.
                    </p>
                  )}
                </article>
              )
            })}
          </div>
        </section>

        <p className="mt-6 text-center text-sm text-slate-500">
          Akwaaba Night administration · Voting and payments disabled
        </p>
      </div>
    </main>
  )
}
