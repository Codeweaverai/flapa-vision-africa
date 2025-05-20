
import React from 'react';
import Layout from '@/components/layout/Layout';
import HeroSection from '@/components/home/HeroSection';
import AboutSection from '@/components/home/AboutSection';
import EventsSection from '@/components/home/EventsSection';
import CoursesSection from '@/components/home/CoursesSection';
import MediaSection from '@/components/home/MediaSection';
import SpeakingSection from '@/components/home/SpeakingSection';
import CallToAction from '@/components/home/CallToAction';

const HomePage = () => {
  return (
    <Layout>
      <HeroSection />
      <AboutSection />
      <CoursesSection />
      <MediaSection />
      <EventsSection />
      <SpeakingSection />
      <CallToAction />
    </Layout>
  );
};

export default HomePage;
