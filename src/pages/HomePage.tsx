
import React from 'react';
import Layout from '@/components/layout/Layout';
import HeroSection from '@/components/home/HeroSection';
import AboutSection from '@/components/home/AboutSection';
import EventsSection from '@/components/home/EventsSection';
import PastEventsSection from '@/components/home/PastEventsSection';
import CoursesSection from '@/components/home/CoursesSection';
import MediaSection from '@/components/home/MediaSection';
import AnimationsSection from '@/components/home/AnimationsSection';
import CommunityAISection from '@/components/home/CommunityAISection';
import CallToAction from '@/components/home/CallToAction';

const HomePage = () => {
  return (
    <Layout>
      <HeroSection />
      <AboutSection />
      <CoursesSection />
      <CommunityAISection />
      <EventsSection />
      <PastEventsSection />
      <MediaSection />
      <CallToAction />
    </Layout>
  );
};

export default HomePage;
