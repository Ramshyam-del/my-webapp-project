export const Roadmap = () => (
  <section id="roadmap" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 text-center bg-gradient-to-r from-gray-900 to-gray-800">
    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-white">Roadmap</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
      <div className="bg-gray-700 p-4 sm:p-5 md:p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:transform hover:scale-105">
        <h3 className="text-xl sm:text-2xl text-cyan-400 mb-2 font-semibold">Phase 1</h3>
        <p className="text-gray-200 text-sm sm:text-base leading-relaxed">Token Launch & Community Building</p>
      </div>
      <div className="bg-gray-700 p-4 sm:p-5 md:p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:transform hover:scale-105">
        <h3 className="text-xl sm:text-2xl text-cyan-400 mb-2 font-semibold">Phase 2</h3>
        <p className="text-gray-200 text-sm sm:text-base leading-relaxed">DEX Listings & Partnerships</p>
      </div>
      <div className="bg-gray-700 p-4 sm:p-5 md:p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:transform hover:scale-105 sm:col-span-2 lg:col-span-1">
        <h3 className="text-xl sm:text-2xl text-cyan-400 mb-2 font-semibold">Phase 3</h3>
        <p className="text-gray-200 text-sm sm:text-base leading-relaxed">Ecosystem Expansion & Governance</p>
      </div>
    </div>
  </section>
);