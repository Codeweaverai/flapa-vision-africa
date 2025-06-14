
import Layout from '@/components/layout/Layout';
import HeroSection from '@/components/home/HeroSection';
import AboutSection from '@/components/home/AboutSection';
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
      <LearningSection />
      <EventsSection />
      <CallToAction />
    </Layout>
  );
};

export default Index;
