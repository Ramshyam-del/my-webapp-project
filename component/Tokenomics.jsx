export const Tokenomics = () => (
  <section id="tokenomics" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 text-center bg-gradient-to-r from-gray-900 to-gray-800">
    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-white">Tokenomics</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
      <div className="bg-gray-700 p-4 sm:p-5 md:p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:transform hover:scale-105">
        <h3 className="text-xl sm:text-2xl text-cyan-400 mb-2 font-semibold">Community</h3>
        <p className="text-gray-200 text-sm sm:text-base leading-relaxed">65% – Distributed to community members and liquidity</p>
      </div>
      <div className="bg-gray-700 p-4 sm:p-5 md:p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:transform hover:scale-105">
        <h3 className="text-xl sm:text-2xl text-cyan-400 mb-2 font-semibold">Development</h3>
        <p className="text-gray-200 text-sm sm:text-base leading-relaxed">20% – Reserved for project development and growth</p>
      </div>
      <div className="bg-gray-700 p-4 sm:p-5 md:p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:transform hover:scale-105 sm:col-span-2 lg:col-span-1">
        <h3 className="text-xl sm:text-2xl text-cyan-400 mb-2 font-semibold">Team</h3>
        <p className="text-gray-200 text-sm sm:text-base leading-relaxed">15% – Team allocation with 12-month vesting</p>
      </div>
    </div>
  </section>
);