export const Features = () => (
  <section id="features" className="py-20 px-6 text-center bg-gray-900">
    <h2 className="text-4xl font-bold mb-12">Features</h2>
    <div className="grid md:grid-cols-3 gap-10 max-w-5xl mx-auto">
      <div className="bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg">
        <h3 className="text-xl font-semibold mb-3 text-cyan-400">Fair Launch</h3>
        <p className="text-gray-300">No presale, no VC — 100% for the community.</p>
      </div>
      <div className="bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg">
        <h3 className="text-xl font-semibold mb-3 text-cyan-400">On-Chain Governance</h3>
        <p className="text-gray-300">Vote on future upgrades and development.</p>
      </div>
      <div className="bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg">
        <h3 className="text-xl font-semibold mb-3 text-cyan-400">Auto Liquidity</h3>
        <p className="text-gray-300">Built-in liquidity growth with every transaction.</p>
      </div>
    </div>
  </section>
); 