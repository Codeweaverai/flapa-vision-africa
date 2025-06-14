
import Layout from '@/components/layout/Layout';
import HeroSection from '@/components/home/HeroSection';
import AboutSection from '@/components/home/AboutSection';
import SpeakingSection from '@/components/home/SpeakingSection';
import AnimationsSection from '@/components/home/AnimationsSection';
import LearningSection from '@/components/home/LearningSection';
import EventsSection from '@/components/home/EventsSection';
import CoursesSection from '@/components/home/CoursesSection';
import MediaSection from '@/components/home/MediaSection';
import CommunityAISection from '@/components/home/CommunityAISection';
import CallToAction from '@/components/home/CallToAction';

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <AboutSection />
      <CoursesSection />
      <CommunityAISection />
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
