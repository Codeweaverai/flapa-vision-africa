
import Layout from '@/components/layout/Layout';
import HeroSection from '@/components/home/HeroSection';
import AboutSection from '@/components/home/AboutSection';
import VenturesSection from '@/components/home/VenturesSection';
import SpeakingSection from '@/components/home/SpeakingSection';
import AnimationsSection from '@/components/home/AnimationsSection';
import LearningSection from '@/components/home/LearningSection';
import EventsSection from '@/components/home/EventsSection';
import CoursesSection from '@/components/home/CoursesSection';
import MediaSection from '@/components/home/MediaSection';
import CallToAction from '@/components/home/CallToAction';

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <AboutSection />
      <VenturesSection />
      <CoursesSection />
      <MediaSection />
      <AnimationsSection />
      <SpeakingSection />
      <LearningSection />
      <EventsSection />
      <CallToAction />
    </Layout>
  );
};

export default Index;
