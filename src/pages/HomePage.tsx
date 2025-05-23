
import React from 'react';
import Layout from '@/components/layout/Layout';
import HeroSection from '@/components/home/HeroSection';
import AboutSection from '@/components/home/AboutSection';
import EventsSection from '@/components/home/EventsSection';
import CoursesSection from '@/components/home/CoursesSection';
import MediaSection from '@/components/home/MediaSection';
import AnimationsSection from '@/components/home/AnimationsSection';
import CallToAction from '@/components/home/CallToAction';
import VideoHeroSection from '@/components/home/VideoHeroSection';

const HomePage = () => {
  return (
    <Layout>
      <HeroSection />
      <AboutSection />
      <CoursesSection />
      <VideoHeroSection />
      <AnimationsSection />
      <EventsSection />
      <MediaSection />
      <CallToAction />
    </Layout>
  );
};

export default HomePage;
