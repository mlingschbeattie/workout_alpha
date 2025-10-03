export default function Footer() {
  return (
    <footer className="mt-10 border-t border-black/10 bg-white py-6">
      <div className="ua-container flex flex-col items-center justify-between gap-2 sm:flex-row">
        <p className="text-sm text-black/70">© {new Date().getFullYear()} DT Explosive</p>
        <div className="flex items-center gap-4 text-sm">
          <a className="hover:text-[var(--ua-red)]" href="/privacy">Privacy</a>
          <a className="hover:text-[var(--ua-red)]" href="/terms">Terms</a>
        </div>
      </div>
    </footer>
  );
}

