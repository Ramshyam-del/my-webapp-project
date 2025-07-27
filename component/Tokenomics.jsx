export const Tokenomics = () => (
  <section id="tokenomics" className="py-20 px-6 text-center bg-gradient-to-r from-gray-900 to-gray-800">
    <h2 className="text-4xl font-bold mb-8">Tokenomics</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
      <div className="bg-gray-700 p-6 rounded-lg shadow-md">
        <h3 className="text-2xl text-cyan-400 mb-2">Community</h3>
        <p>65% – Distributed to community members and liquidity</p>
      </div>
      <div className="bg-gray-700 p-6 rounded-lg shadow-md">
        <h3 className="text-2xl text-cyan-400 mb-2">Development</h3>
        <p>20% – Reserved for project development and growth</p>
      </div>
      <div className="bg-gray-700 p-6 rounded-lg shadow-md">
        <h3 className="text-2xl text-cyan-400 mb-2">Team</h3>
        <p>15% – Team allocation with 12-month vesting</p>
      </div>
    </div>
  </section>
); 