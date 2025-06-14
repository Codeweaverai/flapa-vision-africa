
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CircuitBoard, Workflow, BarChart, Bot } from 'lucide-react';
import { Link } from 'react-router-dom';

const AnimationsSection = () => {
  return (
    <section className="section-container bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="mb-12 max-w-3xl mx-auto text-center">
        <h2 className="heading-lg mb-6 text-gradient">AI Workflow Automations</h2>
        <p className="text-lg text-gray-600">
          Transform your business operations through intelligent automation solutions 
          that streamline processes, reduce costs, and increase productivity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="bg-card hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CircuitBoard className="h-5 w-5 text-primary" />
              Intelligent Processing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              AI-powered document processing systems that automatically extract, categorize, 
              and route information with 98% accuracy.
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5 text-primary" />
              Workflow Optimization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Streamline complex business processes by identifying bottlenecks and 
              automating repetitive tasks, reducing processing time by up to 75%.
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-primary" />
              Predictive Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Forecast trends, anticipate issues, and make data-driven decisions 
              with advanced predictive models built on your business data.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Button asChild size="lg">
          <Link to="/automations">
            <Bot className="h-5 w-5 mr-2" />
            Explore Automations
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default AnimationsSection;
