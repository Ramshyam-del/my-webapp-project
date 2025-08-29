export const Features = () => (
  <section id="features" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 text-center bg-gray-900">
    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 sm:mb-10 md:mb-12 text-white">Features</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10 max-w-5xl mx-auto">
      <div className="bg-gray-800 rounded-xl p-4 sm:p-5 md:p-6 shadow-md hover:shadow-lg transition-all duration-300 hover:transform hover:scale-105">
        <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-cyan-400">Fair Launch</h3>
        <p className="text-gray-300 text-sm sm:text-base leading-relaxed">No presale, no VC — 100% for the community.</p>
      </div>
      <div className="bg-gray-800 rounded-xl p-4 sm:p-5 md:p-6 shadow-md hover:shadow-lg transition-all duration-300 hover:transform hover:scale-105">
        <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-cyan-400">On-Chain Governance</h3>
        <p className="text-gray-300 text-sm sm:text-base leading-relaxed">Vote on future upgrades and development.</p>
      </div>
      <div className="bg-gray-800 rounded-xl p-4 sm:p-5 md:p-6 shadow-md hover:shadow-lg transition-all duration-300 hover:transform hover:scale-105 sm:col-span-2 lg:col-span-1">
        <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-cyan-400">Auto Liquidity</h3>
        <p className="text-gray-300 text-sm sm:text-base leading-relaxed">Built-in liquidity growth with every transaction.</p>
      </div>
    </div>
  </section>
);