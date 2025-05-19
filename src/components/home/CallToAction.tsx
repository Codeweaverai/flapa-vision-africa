
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const CallToAction = () => {
  return (
    <section className="bg-gradient-to-br from-primary to-secondary text-white py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="heading-lg mb-6">Begin Your Journey with SkillPulse</h2>
        <p className="text-xl mb-8">
          Whether you're looking to enhance your skills, find professional events, or share your expertise, 
          SkillPulse offers the platform and connections you need.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
            <Link to="/consult">Book a Consultation</Link>
          </Button>
          <Button asChild size="lg" variant="default" className="bg-white text-primary hover:bg-white/90">
            <Link to="/learning">Explore Courses</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
