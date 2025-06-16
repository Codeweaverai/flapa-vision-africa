
import React from 'react';
import Layout from '@/components/layout/Layout';
import HeroSection from '@/components/home/HeroSection';
import AboutSection from '@/components/home/AboutSection';
import BrowseCategoriesSection from '@/components/home/BrowseCategoriesSection';
import EventsSection from '@/components/home/EventsSection';
import PastEventsSection from '@/components/home/PastEventsSection';
import CoursesSection from '@/components/home/CoursesSection';
import MediaSection from '@/components/home/MediaSection';
import CommunityAISection from '@/components/home/CommunityAISection';
import CallToAction from '@/components/home/CallToAction';
import LearningSection from '@/components/home/LearningSection';
import CreatorsSection from '@/components/home/CreatorsSection';

const HomePage = () => {
  console.log('HomePage rendering with sections:');
  console.log('- HeroSection');
  console.log('- AboutSection');
  console.log('- BrowseCategoriesSection');
  console.log('- CoursesSection');
  console.log('- CreatorsSection');
  console.log('- CommunityAISection');
  console.log('- EventsSection');
  console.log('- PastEventsSection');
  console.log('- LearningSection');
  console.log('- MediaSection');
  console.log('- CallToAction');

  return (
    <Layout>
      <HeroSection />
      <AboutSection />
      <BrowseCategoriesSection />
      <CoursesSection />
      <CreatorsSection />
      <CommunityAISection />
      <EventsSection />
      <PastEventsSection />
      <LearningSection />
      <MediaSection />
      <CallToAction />
    </Layout>
  );
};

export default HomePage;
