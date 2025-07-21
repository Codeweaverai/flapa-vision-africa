
import Layout from '@/components/layout/Layout';
import HeroSection from '@/components/home/HeroSection';
import AboutSection from '@/components/home/AboutSection';
import LearningSection from '@/components/home/LearningSection';
import EventsSection from '@/components/home/EventsSection';
import CoursesSection from '@/components/home/CoursesSection';
import MediaSection from '@/components/home/MediaSection';
import CommunityAISection from '@/components/home/CommunityAISection';
import CallToAction from '@/components/home/CallToAction';
import BrowseCategoriesSection from '@/components/home/BrowseCategoriesSection';
import CreatorsSection from '@/components/home/CreatorsSection';
import TrendingNowSection from '@/components/home/TrendingNowSection';
import LocalContentSection from '@/components/home/LocalContentSection';

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <BrowseCategoriesSection />
      <CoursesSection />
      <CommunityAISection />
      <LocalContentSection />
      <MediaSection />
      <LearningSection />
      <TrendingNowSection />
      <EventsSection />
       <AboutSection />
      <CreatorsSection />
      <CallToAction />
    </Layout>
  );
};

export default Index;
