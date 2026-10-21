import { Hero } from './components/Hero';
import { Services } from './components/Services';
import { Features } from './components/Features';
import { Programs } from './components/Programs';
import { Stats } from './components/Stats';
import CampusHighlights from './components/CampusHighlights';
import CalenderView from './components/CalenderView';
import { CallToAction } from './components/CallToAction';
import { Footer } from './components/Footer';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Services />
      <Features />
      <Stats />
      <Programs />
      <CalenderView />
      <CampusHighlights />
      <CallToAction />
      <Footer />
    </main>
  );
}
