'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Category = {
  id: string
  name: string
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
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [nominees, setNominees] = useState<Nominee[]>([])

  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  async function loadData() {
    const supabase = createClient()

    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .select('id, name')
      .order('name')

    if (categoryError) throw categoryError

    const { data: nomineeData, error: nomineeError } = await supabase
      .from('nominees')
      .select('id, category_id, name, description, is_active')
      .order('name')

    if (nomineeError) throw nomineeError

    setCategories(categoryData ?? [])
    setNominees(nomineeData ?? [])

    if (!categoryId && categoryData?.length) {
      setCategoryId(categoryData[0].id)
    }
  }

  useEffect(() => {
    async function initialize() {
      const supabase = createClient()

      try {
        const { data, error: authError } = await supabase.auth.getUser()

        if (authError || !data.user) {
          router.replace('/admin/login')
          return
        }

        setEmail(data.user.email ?? '')

        const { data: role, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .maybeSingle()

        if (roleError || role?.role !== 'admin') {
          await supabase.auth.signOut()
          router.replace('/admin/login')
          return
        }

        await loadData()
      } catch {
        setError('Unable to load the dashboard. Please refresh the page.')
      } finally {
        setLoading(false)
      }
    }

    initialize()
  }, [router])

  function resetForm() {
    setName('')
    setDescription('')
    setEditingId(null)
    setMessage('')
    setError('')
  }

  function startEditing(nominee: Nominee) {
    setEditingId(nominee.id)
    setName(nominee.name)
    setCategoryId(nominee.category_id)
    setDescription(nominee.description ?? '')
    setMessage('')
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const supabase = createClient()

      const values = {
        name: name.trim(),
        category_id: categoryId,
        description: description.trim() || null,
      }

      if (editingId) {
        const { error } = await supabase
          .from('nominees')
          .update(values)
          .eq('id', editingId)

        if (error) throw error

        setMessage('Nominee details updated successfully.')
      } else {
        const { error } = await supabase.from('nominees').insert({
          ...values,
          is_active: false,
        })

        if (error) throw error

        setMessage(
          'Nominee added as unpublished. Publish only when ready.'
        )
      }

      resetForm()
      await loadData()

      if (!editingId) {
        setMessage(
          'Nominee added as unpublished. Publish only when ready.'
        )
      } else {
        setMessage('Nominee details updated successfully.')
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not save the nominee. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function togglePublished(nominee: Nominee) {
    const action = nominee.is_active ? 'unpublish' : 'publish'

    if (
      !window.confirm(
        `Are you sure you want to ${action} ${nominee.name}?`
      )
    ) {
      return
    }

    setError('')
    setMessage('')

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('nominees')
        .update({ is_active: !nominee.is_active })
        .eq('id', nominee.id)

      if (error) throw error

      await loadData()
      setMessage(
        `${nominee.name} has been ${action === 'publish' ? 'published' : 'unpublished'}.`
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not change the publication status.'
      )
    }
  }

  async function deleteNominee(nominee: Nominee) {
    if (
      !window.confirm(
        `Delete ${nominee.name}? This action cannot be undone.`
      )
    ) {
      return
    }

    setError('')
    setMessage('')

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('nominees')
        .delete()
        .eq('id', nominee.id)

      if (error) throw error

      if (editingId === nominee.id) resetForm()

      await loadData()
      setMessage(`${nominee.name} has been deleted.`)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not delete the nominee.'
      )
    }
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/admin/login')
    router.refresh()
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        Loading administrator dashboard...
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 overflow-hidden rounded-2xl bg-slate-950 text-white shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-400">Akwaaba Night</p>
              <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Administrator Dashboard</h1>
              <p className="mt-2 text-sm text-slate-300">Manage awards and nominees from one place.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-300">ADMIN AREA</span>
              <button
                onClick={handleLogout}
                className="rounded-lg bg-white px-4 py-2 font-semibold text-slate-900 transition hover:bg-amber-300"
              >
                Sign out
              </button>
            </div>
          </div>
          <nav aria-label="Administrator navigation" className="flex flex-wrap gap-2 px-5 py-4 sm:px-8">
            <a href="/admin" className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950">Dashboard</a>
            <a href="/admin/categories" className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">Manage Categories</a>
            <a href="/admin#nominees" className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">Manage Nominees</a>
          </nav>
        </header>

        <section className="mb-8 flex items-start gap-4 rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-200 text-xl" aria-hidden="true">!</div>
          <div>
            <h2 className="font-bold text-amber-950">Preview mode — voting and payments are OFF</h2>
            <p className="mt-1 text-sm leading-6 text-amber-900">
              This website is being prepared. No votes or payments can be made. Only authorized administrators can manage award information.
            </p>
          </div>
        </section>

        {error && (
          <p role="alert" className="mb-4 rounded-lg bg-red-100 p-4 text-red-800">
            {error}
          </p>
        )}

        {message && (
          <p role="status" className="mb-4 rounded-lg bg-green-100 p-4 text-green-800">
            {message}
          </p>
        )}

        <section className="mb-8 grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 border-t-4 border-t-amber-400 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-600">Award categories</p>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-lg" aria-hidden="true">◆</span>
            </div>
            <p className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950">{categories.length}</p>
            <p className="mt-1 text-sm text-slate-500">Categories in your awards setup</p>
          </div>

          <div className="rounded-2xl border border-slate-200 border-t-4 border-t-blue-900 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-600">Nominees</p>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-lg" aria-hidden="true">♙</span>
            </div>
            <p className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950">{nominees.length}</p>
            <p className="mt-1 text-sm text-slate-500">Nominees across all categories</p>
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-extrabold text-slate-950">
            {editingId ? 'Edit nominee' : 'Add a nominee'}
          </h2>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="nominee-name" className="mb-1 block font-medium">
                Nominee name
              </label>
              <input
                id="nominee-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={150}
                className="w-full rounded-xl border border-slate-300 bg-white p-3 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                placeholder="Enter nominee's full name"
              />
            </div>

            <div>
              <label htmlFor="category" className="mb-1 block font-medium">
                Award category
              </label>
              <select
                id="category"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                required
                className="w-full rounded-md border border-slate-300 p-3"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="description" className="mb-1 block font-medium">
                Description (optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={1000}
                rows={3}
                className="w-full rounded-md border border-slate-300 p-3"
                placeholder="Enter a short description"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving || categories.length === 0}
                className="rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-blue-900 disabled:opacity-50"
              >
                {saving
                  ? 'Saving...'
                  : editingId
                    ? 'Save changes'
                    : 'Add nominee'}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-md border px-5 py-3"
                >
                  Cancel edit
                </button>
              )}
            </div>
          </form>
        </section>

        <section id="nominees" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-extrabold text-slate-950">
            Manage nominees
          </h2>

          {categories.map((category) => {
            const categoryNominees = nominees.filter(
              (nominee) => nominee.category_id === category.id
            )

            return (
              <div key={category.id} className="mb-6">
                <h3 className="mb-3 border-b pb-2 font-bold">
                  {category.name} ({categoryNominees.length})
                </h3>

                {categoryNominees.length === 0 ? (
                  <p className="mb-4 text-sm text-slate-500">
                    No nominees in this category.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {categoryNominees.map((nominee) => (
                      <article
                        key={nominee.id}
                        className="rounded-lg border border-slate-200 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{nominee.name}</p>
                            {nominee.description && (
                              <p className="mt-1 text-sm text-slate-600">
                                {nominee.description}
                              </p>
                            )}
                            <span
                              className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                                nominee.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {nominee.is_active ? 'Published' : 'Unpublished'}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => startEditing(nominee)}
                              className="rounded-md border px-3 py-2 text-sm"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => togglePublished(nominee)}
                              className="rounded-md border px-3 py-2 text-sm"
                            >
                              {nominee.is_active ? 'Unpublish' : 'Publish'}
                            </button>

                            <button
                              onClick={() => deleteNominee(nominee)}
                              className="rounded-md bg-red-600 px-3 py-2 text-sm text-white"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </section>

        <p className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-center text-sm text-slate-500">
          Akwaaba Night administration · Voting and payments disabled
        </p>
      </div>
    </main>
  )
}
