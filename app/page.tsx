import Link from "next/link";

const categories = [
  { name: "Best Performer", description: "Celebrate outstanding stage performances." },
  { name: "Best New Act", description: "Recognise a rising star." },
  { name: "Audience Favourite", description: "Celebrate the nominee loved by fans." },
];

export default function Home() {
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
          Welcome to the Akwaaba Night voting portal. Explore the award
          categories and get ready to support your favourite nominees.
        </p>
        <div className="notice" role="status">
          <strong>Preview mode</strong>
          <span>Voting and payments are not active yet. No votes or payments are being collected.</span>
        </div>
      </section>

      <section className="categories" aria-labelledby="categories-title">
        <div className="section-heading">
          <p className="eyebrow">THE AWARDS</p>
          <h2 id="categories-title">Categories coming soon</h2>
          <p>Official nominees will appear here once the organiser confirms the list.</p>
        </div>
        <div className="card-grid">
          {categories.map((category, index) => (
            <article className="category-card" key={category.name}>
              <span className="card-number">0{index + 1}</span>
              <h3>{category.name}</h3>
              <p>{category.description}</p>
              <span className="coming-soon">Nominees to be announced</span>
            </article>
          ))}
        </div>
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
