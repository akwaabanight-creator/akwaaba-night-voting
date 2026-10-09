"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Category = {
  id: string;
  name: string;
  description: string | null;
};

type Nominee = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
};

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [loading, setLoading] = useState(true);
  const [databaseError, setDatabaseError] = useState("");

  useEffect(() => {
    async function loadAwards() {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        setDatabaseError("The awards database connection has not been configured yet.");
        setLoading(false);
        return;
      }

      const headers = {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      };

      try {
        const [categoryResponse, nomineeResponse] = await Promise.all([
          fetch(
            `${supabaseUrl}/rest/v1/categories?select=id,name,description&is_active=eq.true&order=name.asc`,
            { headers, cache: "no-store" },
          ),
          fetch(
            `${supabaseUrl}/rest/v1/nominees?select=id,category_id,name,description,image_url&is_active=eq.true&order=name.asc`,
            { headers, cache: "no-store" },
          ),
        ]);

        if (!categoryResponse.ok || !nomineeResponse.ok) {
          throw new Error("The database did not return the awards list. Please check the database policies and environment settings.");
        }

        const categoryData = (await categoryResponse.json()) as Category[];
        const nomineeData = (await nomineeResponse.json()) as Nominee[];
        setCategories(categoryData);
        setNominees(nomineeData);
      } catch {
        setDatabaseError("We could not load the awards list just now. Please refresh the page and try again.");
      } finally {
        setLoading(false);
      }
    }

    void loadAwards();
  }, []);

  return (
    <main>
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Akwaaba Night home">
          <span className="brand-mark">A</span>
          <span>AKWAABA <b>NIGHT</b></span>
        </Link>
        <span className="status">VOTING PORTAL PREVIEW</span>
      </header>

      <section className="hero">
        <p className="eyebrow">CELEBRATING TALENT • CULTURE • EXCELLENCE</p>
        <h1>Your vote.<br /><span>Your voice.</span></h1>
        <p className="intro">
          Welcome to the Akwaaba Night voting portal. Explore the confirmed award
          categories and nominees as they are published by the organisers.
        </p>
        <div className="notice" role="status">
          <strong>Preview mode</strong>
          <span>Voting and payments are not active yet. No votes or payments are being collected.</span>
        </div>
      </section>

      <section className="categories" aria-labelledby="categories-title">
        <div className="section-heading">
          <p className="eyebrow">THE AWARDS</p>
          <h2 id="categories-title">Award categories and nominees</h2>
          <p>Only active categories and nominees approved for display in the database appear here.</p>
        </div>

        {loading && <p className="data-message" role="status">Loading the official awards list…</p>}

        {!loading && databaseError && (
          <p className="data-message" role="alert">{databaseError}</p>
        )}

        {!loading && !databaseError && categories.length === 0 && (
          <p className="data-message">
            The official categories have not been published yet. Please check back later.
          </p>
        )}

        {!loading && !databaseError && categories.length > 0 && (
          <div className="card-grid">
            {categories.map((category, index) => {
              const categoryNominees = nominees.filter(
                (nominee) => nominee.category_id === category.id,
              );

              return (
                <article className="category-card" key={category.id}>
                  <span className="card-number">{String(index + 1).padStart(2, "0")}</span>
                  <h3>{category.name}</h3>
                  {category.description && <p>{category.description}</p>}
                  {categoryNominees.length > 0 ? (
                    <ul className="nominee-list">
                      {categoryNominees.map((nominee) => (
                        <li key={nominee.id}>
                          {nominee.image_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img className="nominee-image" src={nominee.image_url} alt="" />
                          )}
                          <span>
                            <strong>{nominee.name}</strong>
                            {nominee.description && <small>{nominee.description}</small>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="coming-soon">Nominees to be announced</span>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="how-it-works">
        <p className="eyebrow">HOW IT WILL WORK</p>
        <h2>Simple. Secure. Fair.</h2>
        <div className="steps">
          <div><span>01</span><h3>Choose</h3><p>Browse the confirmed award categories and nominees.</p></div>
          <div><span>02</span><h3>Vote</h3><p>Follow the published voting rules when voting opens.</p></div>
          <div><span>03</span><h3>Confirm</h3><p>When enabled, payment and vote confirmation will be verified securely.</p></div>
        </div>
      </section>

      <footer>
        <span>© {new Date().getFullYear()} Akwaaba Night</span>
        <span>Official voting portal • Preview only</span>
      </footer>
    </main>
  );
}
