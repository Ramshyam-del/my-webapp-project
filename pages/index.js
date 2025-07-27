import { Navbar } from '../component/Navbar';
import { Herosection } from '../component/Herosection';
import { Features } from '../component/Features';
import { Roadmap } from '../component/Roadmap';
import { Tokenomics } from '../component/Tokenomics';
import { Footer } from '../component/Footer';
import { motion } from 'framer-motion';

const glass = "backdrop-blur-md bg-white/20 border border-white/20 rounded-2xl shadow-xl";
const sectionVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.98 },
  visible: (i = 1) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.15,
      duration: 0.8,
      ease: 'easeOut',
    },
  }),
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-700 via-cyan-600 to-purple-700">
      <Navbar />
      <main className="flex-1 flex flex-col gap-16 md:gap-24">
        <motion.section
          id="herosection"
          custom={0}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariants}
          className={`pt-8 md:pt-16 pb-8 md:pb-16 mx-auto w-full max-w-5xl px-4 ${glass} scroll-mt-24`}
        >
      <Herosection />
        </motion.section>
        <motion.section
          id="features"
          custom={1}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariants}
          className={`py-8 md:py-16 mx-auto w-full max-w-5xl px-4 ${glass} scroll-mt-24`}
        >
      <Features />
        </motion.section>
        <motion.section
          id="roadmap"
          custom={2}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariants}
          className={`py-8 md:py-16 mx-auto w-full max-w-5xl px-4 ${glass} scroll-mt-24`}
        >
      <Roadmap />
        </motion.section>
        <motion.section
          id="tokenomics"
          custom={3}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={sectionVariants}
          className={`py-8 md:py-16 mx-auto w-full max-w-5xl px-4 ${glass} scroll-mt-24`}
        >
      <Tokenomics />
        </motion.section>
      </main>
      <Footer />
    </div>
  );
} 