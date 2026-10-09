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

export default function CategoryManagementPage() {
  const router = useRouter()

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  async function loadCategories() {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('categories')
      .select('id, name, description, is_active')
      .order('name')

    if (error) throw error

    setCategories(data ?? [])
  }

  useEffect(() => {
    async function initialize() {
      const supabase = createClient()

      try {
        const { data, error } = await supabase.auth.getUser()

        if (error || !data.user) {
          router.replace('/admin/login')
          return
        }

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

        await loadCategories()
      } catch {
        setError('Could not load categories. Please refresh the page.')
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
  }

  function startEditing(category: Category) {
    setEditingId(category.id)
    setName(category.name)
    setDescription(category.description ?? '')
    setMessage('')
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!name.trim()) {
      setError('Please enter a category name.')
      return
    }

    setSaving(true)
    setError('')
    setMessage('')

    try {
      const supabase = createClient()

      const values = {
        name: name.trim(),
        description: description.trim() || null,
      }

      if (editingId) {
        const { error } = await supabase
          .from('categories')
          .update(values)
          .eq('id', editingId)

        if (error) throw error

        setMessage('Category updated successfully.')
      } else {
        const { error } = await supabase.from('categories').insert({
          ...values,
          is_active: false,
        })

        if (error) throw error

        setMessage(
          'Category created as unpublished. Publish it when you are ready.'
        )
      }

      resetForm()
      await loadCategories()

      if (editingId) {
        setMessage('Category updated successfully.')
      } else {
        setMessage(
          'Category created as unpublished. Publish it when you are ready.'
        )
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not save the category. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function togglePublished(category: Category) {
    const action = category.is_active ? 'unpublish' : 'publish'

    if (
      !window.confirm(
        `Are you sure you want to ${action} "${category.name}"?`
      )
    ) {
      return
    }

    setError('')
    setMessage('')

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('categories')
        .update({ is_active: !category.is_active })
        .eq('id', category.id)

      if (error) throw error

      await loadCategories()

      setMessage(
        `"${category.name}" has been ${action === 'publish' ? 'published' : 'unpublished'}.`
      )
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not change the category status.'
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
        Loading category management...
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-amber-600">AKWAABA NIGHT</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Category Management
            </h1>
            <p className="mt-2 text-slate-600">
              Create, edit and manage award categories.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-md border bg-white px-4 py-2"
          >
            Sign out
          </button>
        </header>

        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <h2 className="font-bold text-amber-900">Preview mode</h2>
          <p className="mt-1 text-sm text-amber-900">
            Voting and payments remain disabled. New categories start
            unpublished. Unpublishing a category also hides its nominees
            from the public awards page.
          </p>
        </div>

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

        <section className="mb-8 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold">
            {editingId ? 'Edit category' : 'Add a category'}
          </h2>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="category-name" className="mb-1 block font-medium">
                Category name
              </label>
              <input
                id="category-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={150}
                className="w-full rounded-md border border-slate-300 p-3"
                placeholder="e.g. Best Performer Award"
              />
            </div>

            <div>
              <label
                htmlFor="category-description"
                className="mb-1 block font-medium"
              >
                Description (optional)
              </label>
              <textarea
                id="category-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={1000}
                rows={3}
                className="w-full rounded-md border border-slate-300 p-3"
                placeholder="Describe this award category"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-slate-900 px-5 py-3 font-semibold text-white disabled:opacity-50"
              >
                {saving
                  ? 'Saving...'
                  : editingId
                    ? 'Save changes'
                    : 'Add category'}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    resetForm()
                    setError('')
                    setMessage('')
                  }}
                  className="rounded-md border px-5 py-3"
                >
                  Cancel edit
                </button>
              )}

              <button
                type="button"
                onClick={() => router.push('/admin')}
                className="rounded-md border px-5 py-3"
              >
                Back to dashboard
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Existing categories</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">
              {categories.length} categories
            </span>
          </div>

          <div className="space-y-4">
            {categories.map((category) => (
              <article
                key={category.id}
                className="rounded-lg border border-slate-200 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900">
                      {category.name}
                    </h3>

                    {category.description && (
                      <p className="mt-2 text-sm text-slate-600">
                        {category.description}
                      </p>
                    )}

                    <span
                      className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                        category.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {category.is_active ? 'Published' : 'Unpublished'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startEditing(category)}
                      className="rounded-md border px-3 py-2 text-sm"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => togglePublished(category)}
                      className="rounded-md border px-3 py-2 text-sm"
                    >
                      {category.is_active ? 'Unpublish' : 'Publish'}
                    </button>
                  </div>
                </div>
              </article>
            ))}

            {categories.length === 0 && (
              <p className="text-slate-500">No categories found.</p>
            )}
          </div>
        </section>

        <p className="mt-6 text-center text-sm text-slate-500">
          Akwaaba Night Administration · Voting and payments disabled
        </p>
      </div>
    </main>
  )
}
