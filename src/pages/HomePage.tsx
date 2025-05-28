
import React from 'react';
import Layout from '@/components/layout/Layout';
import HeroSection from '@/components/home/HeroSection';
import AboutSection from '@/components/home/AboutSection';
import EventsSection from '@/components/home/EventsSection';
import CoursesSection from '@/components/home/CoursesSection';
import MediaSection from '@/components/home/MediaSection';
import AnimationsSection from '@/components/home/AnimationsSection';
import CommunityAISection from '@/components/home/CommunityAISection';
import CallToAction from '@/components/home/CallToAction';
import FeaturedEventsSection from '@/components/home/FeaturedEventsSection';

const HomePage = () => {
  return (
    <Layout>
      <HeroSection />
      <AboutSection />
      <CoursesSection />
      <CommunityAISection />
      <AnimationsSection />
      <FeaturedEventsSection />
      <EventsSection />
      <MediaSection />
      <CallToAction />
    </Layout>
  );
};

export default HomePage;
