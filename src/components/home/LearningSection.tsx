
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const LearningSection = () => {
  return (
    <section className="section-container">
      <div className="text-center mb-12">
        <h2 className="heading-lg mb-4">Learning & Consulting</h2>
        <p className="text-xl max-w-3xl mx-auto">
          Access expert knowledge on technology, entrepreneurship, and African business 
          through online courses and one-on-one consulting sessions.
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-12 items-center">
        {/* Consulting */}
        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-8 rounded-xl border border-primary/20">
          <h3 className="heading-md mb-4">One-on-One Consulting</h3>
          <p className="mb-6 text-lg">
            Book personalized sessions with Mbolela to discuss your business challenges, 
            technology implementation, or African market entry strategies. Get tailored 
            advice from an experienced entrepreneur and innovator.
          </p>
          <ul className="space-y-3 mb-8">
            <li className="flex items-center">
              <span className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-3">✓</span>
              <span>60-minute video consultations via Google Meet</span>
            </li>
            <li className="flex items-center">
              <span className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-3">✓</span>
              <span>Flexible scheduling with calendar integration</span>
            </li>
            <li className="flex items-center">
              <span className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-3">✓</span>
              <span>Session recordings and follow-up materials</span>
            </li>
          </ul>
          <Button asChild size="lg">
            <Link to="/consult">Book a Consultation</Link>
          </Button>
        </div>
        
        {/* Courses */}
        <div className="bg-gradient-to-br from-accent/10 to-flapabay-dark/10 p-8 rounded-xl border border-accent/20">
          <h3 className="heading-md mb-4">Online Courses</h3>
          <p className="mb-6 text-lg">
            Expand your knowledge and skills through our structured online courses. 
            Learn at your own pace with video lessons, practical exercises, and resources 
            designed for entrepreneurs and professionals.
          </p>
          <div className="space-y-4 mb-8">
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <h4 className="font-bold">AI Automations</h4>
              <p className="text-gray-600">Streamline your business with AI tools</p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <h4 className="font-bold">Skills Development</h4>
              <p className="text-gray-600">Communication, leadership, and digital skills</p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <h4 className="font-bold">Entrepreneurship</h4>
              <p className="text-gray-600">Building startups for the African market</p>
            </div>
          </div>
          <Button asChild size="lg" variant="secondary">
            <Link to="/learning">Explore Courses</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default LearningSection;
