// Composant de chargement global utilisé par :
// - App.jsx pendant le lazy loading des pages
// - PrivateRoute pendant la vérification du token JWT

function PageLoader() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-5 overflow-hidden bg-brand-canvas bg-[radial-gradient(circle_at_top,rgba(75,156,211,0.18),transparent_30%),linear-gradient(180deg,#f7fbff_0%,#ffffff_100%)] px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.3),transparent_48%)]" />
      <div className="relative flex h-20 w-20 items-center justify-center rounded-[2rem] border border-brand-border/80 bg-white/90 shadow-panel">
        <span className="font-display text-2xl font-bold tracking-tight text-brand-blue">EAM</span>
      </div>
      <div className="spinner relative h-8 w-8" />
      <p className="relative text-sm uppercase tracking-[0.28em] text-brand-brown">Laden...</p>
    </div>
  )
}

export default PageLoader
