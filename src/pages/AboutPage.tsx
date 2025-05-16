
import Layout from '@/components/layout/Layout';
import { User, Award, BookOpen, Map, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const AboutPage = () => {
  return (
    <Layout>
      <div className="section-container bg-light-purple">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h1 className="heading-lg mb-6 text-gradient">About Mbolela Pule</h1>
            <p className="text-lg mb-6">
              Founder & CEO of FlapaBay, a visionary entrepreneur dedicated to 
              revolutionizing logistics and travel across Africa through innovative 
              technology solutions and strategic business development.
            </p>
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <Map className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold text-lg">Vision</h3>
                  <p>Building a connected Africa where travel and logistics are seamless, efficient, and accessible to all.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Briefcase className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold text-lg">Industry Experience</h3>
                  <p>15+ years leading innovation in travel technologies, logistics automation, and business strategy.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BookOpen className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold text-lg">Education</h3>
                  <p>MBA in International Business, BSc in Computer Science with specialization in AI and Automation.</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button asChild>
                <Link to="/ventures">Explore Ventures</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/speaking">Speaking Engagements</Link>
              </Button>
            </div>
          </div>
          <div className="rounded-lg overflow-hidden shadow-xl">
            <img 
              src="https://images.unsplash.com/photo-1605810230434-7631ac76ec81" 
              alt="Mbolela Pule" 
              className="w-full h-auto object-cover"
            />
          </div>
        </div>

        <div className="mb-16">
          <h2 className="heading-md mb-8">Professional Journey</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <User className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Leadership</h3>
              <p>
                Founded FlapaBay in 2015 with a mission to transform how people and goods move across Africa.
                Scaled operations to 12 countries and built a team of over 200 dedicated professionals.
              </p>
            </div>
            <div className="bg-card rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <Award className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Achievements</h3>
              <p>
                Recognized as one of Africa's Top 40 Under 40 Entrepreneurs.
                Secured $12M in funding to expand FlapaBay's footprint across the continent.
              </p>
            </div>
            <div className="bg-card rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <BookOpen className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Expertise</h3>
              <p>
                Specializes in leveraging AI for business optimization, logistics 
                innovation, and creating accessible travel solutions for underserved markets.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="heading-md mb-8">Mission Statement</h2>
          <div className="bg-muted rounded-lg p-8">
            <p className="text-xl italic text-center">
              "My mission is to connect people, places, and possibilities across Africa. 
              Through technological innovation and strategic vision, I'm dedicated to 
              breaking down barriers in transportation and logistics, making movement more efficient, 
              accessible, and sustainable for all Africans."
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AboutPage;
