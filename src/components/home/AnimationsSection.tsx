
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const AnimationsSection = () => {
  return (
    <section className="bg-light-purple py-16 md:py-24">
      <div className="section-container">
        <h2 className="heading-lg text-center mb-4">AI Workflow Automations</h2>
        <p className="text-xl text-center mb-12 max-w-3xl mx-auto">
          Elevate your skills and career with SkillPulse AI automation solutions that 
          streamline processes, reduce operational overhead, and boost your entrepreneurial potential.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-all">
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                <line x1="6" y1="6" x2="6.01" y2="6"></line>
                <line x1="6" y1="18" x2="6.01" y2="18"></line>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Document Intelligence</h3>
            <p className="text-gray-600">
              Our AI-powered document processing systems automatically extract, categorize, and 
              analyze business documents, giving entrepreneurs more time for strategic decision-making.
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-all">
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path>
                <path d="M13 5v2"></path>
                <path d="M13 17v2"></path>
                <path d="M13 11v2"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Content Creation</h3>
            <p className="text-gray-600">
              Accelerate your content marketing efforts with AI-generated proposals, social media content, 
              and marketing copy that resonates with your target audience and saves valuable time.
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-all">
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M3 3v18h18"></path>
                <path d="M18 17V9"></path>
                <path d="M13 17V5"></path>
                <path d="M8 17v-3"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Business Analytics</h3>
            <p className="text-gray-600">
              Leverage AI-powered analytics to gain insights from your business data, identify growth opportunities, 
              and make data-driven decisions that give your entrepreneurial ventures a competitive edge.
            </p>
          </div>
        </div>
        
        <div className="text-center">
          <Button asChild size="lg">
            <Link to="/animations">
              Enhance Your Business with AI
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default AnimationsSection;
