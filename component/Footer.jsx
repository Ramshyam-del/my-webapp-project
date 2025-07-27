export const Footer = () => (
  <footer className="bg-black py-10 px-6 text-center text-sm text-gray-400">
    <p>&copy; {new Date().getFullYear()} Quantex. All rights reserved.</p>
    <div className="mt-4 space-x-4">
      <a href="#" className="hover:text-cyan-400">Twitter</a>
      <a href="#" className="hover:text-cyan-400">Telegram</a>
      <a href="#" className="hover:text-cyan-400">Docs</a>
    </div>
  </footer>
); 