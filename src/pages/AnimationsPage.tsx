
import Layout from '@/components/layout/Layout';
import { CircuitBoard, Workflow, Code, BarChart, CloudLightning, Bot, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AnimationsPage = () => {
  return (
    <Layout>
      <div className="section-container bg-light-purple">
        <div className="mb-12 max-w-3xl mx-auto text-center">
          <h1 className="heading-lg mb-6 text-gradient">AI Workflow Automations</h1>
          <p className="text-lg">
            Transforming business operations through intelligent automation solutions 
            that streamline processes, reduce costs, and increase productivity.
          </p>
          <div className="flex justify-center mt-6">
            <Button size="lg">
              <Bot className="h-5 w-5 mr-2" /> Schedule Demo
            </Button>
          </div>
        </div>

        <div className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-card hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CircuitBoard className="h-5 w-5 text-primary" />
                  Intelligent Processing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Our AI-powered document processing systems automatically extract, categorize, 
                  and route information from invoices, receipts, and forms with 98% accuracy.
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
                  with our advanced predictive models built on your business data.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="heading-md mb-8 text-center">Core Automation Solutions</h2>
          
          <Tabs defaultValue="logistics" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="logistics">Logistics Automation</TabsTrigger>
              <TabsTrigger value="customer">Customer Service</TabsTrigger>
              <TabsTrigger value="operations">Operations</TabsTrigger>
            </TabsList>
            
            <TabsContent value="logistics" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-bold mb-4">Smart Logistics Management</h3>
                  <p className="mb-4">
                    Our AI-powered logistics automation suite optimizes route planning, 
                    inventory management, and delivery scheduling, reducing transportation 
                    costs by up to 30% while improving delivery times.
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-start gap-2">
                      <CircuitBoard className="h-5 w-5 text-primary mt-1" />
                      <span>Real-time fleet tracking and management with predictive maintenance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CircuitBoard className="h-5 w-5 text-primary mt-1" />
                      <span>Automated customs documentation and compliance checks</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CircuitBoard className="h-5 w-5 text-primary mt-1" />
                      <span>Dynamic route optimization based on traffic, weather, and vehicle capacity</span>
                    </li>
                  </ul>
                  <Button>
                    <Code className="h-4 w-4 mr-2" /> See Technical Specs
                  </Button>
                </div>
                <div className="bg-muted rounded-lg p-6">
                  <img 
                    src="https://images.unsplash.com/photo-1605810230434-7631ac76ec81" 
                    alt="Logistics automation dashboard" 
                    className="rounded-lg shadow-lg"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="customer" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="bg-muted rounded-lg p-6 lg:order-2">
                  <img 
                    src="https://images.unsplash.com/photo-1649972904349-6e44c42644a7" 
                    alt="Customer service automation" 
                    className="rounded-lg shadow-lg"
                  />
                </div>
                <div className="lg:order-1">
                  <h3 className="text-2xl font-bold mb-4">Intelligent Customer Engagement</h3>
                  <p className="mb-4">
                    Transform your customer service with AI-powered assistants that handle 
                    inquiries, resolve issues, and provide personalized recommendations 24/7, 
                    improving response times by 85%.
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-start gap-2">
                      <CloudLightning className="h-5 w-5 text-primary mt-1" />
                      <span>Multilingual chatbots with natural language understanding</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CloudLightning className="h-5 w-5 text-primary mt-1" />
                      <span>Sentiment analysis for proactive issue resolution</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CloudLightning className="h-5 w-5 text-primary mt-1" />
                      <span>Customer journey mapping and personalized engagement</span>
                    </li>
                  </ul>
                  <Button>
                    <Code className="h-4 w-4 mr-2" /> See Technical Specs
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="operations" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-bold mb-4">Operational Excellence Platform</h3>
                  <p className="mb-4">
                    Streamline internal operations with end-to-end process automation that 
                    connects disparate systems, eliminates manual data entry, and provides 
                    real-time visibility across your organization.
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-start gap-2">
                      <Workflow className="h-5 w-5 text-primary mt-1" />
                      <span>Automated approval workflows and document management</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Workflow className="h-5 w-5 text-primary mt-1" />
                      <span>Cross-system data synchronization and integrity checks</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Workflow className="h-5 w-5 text-primary mt-1" />
                      <span>Customizable dashboards with KPI tracking and alerts</span>
                    </li>
                  </ul>
                  <Button>
                    <Code className="h-4 w-4 mr-2" /> See Technical Specs
                  </Button>
                </div>
                <div className="bg-muted rounded-lg p-6">
                  <img 
                    src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d" 
                    alt="Operations automation dashboard" 
                    className="rounded-lg shadow-lg"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="bg-card rounded-lg p-8 shadow-lg text-center">
          <h2 className="heading-md mb-4">Ready to Automate Your Workflows?</h2>
          <p className="text-lg mb-6 max-w-2xl mx-auto">
            Let our team of AI and automation experts assess your business processes 
            and create a customized solution that drives efficiency and growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg">
              <Bot className="h-5 w-5 mr-2" /> Schedule Demo
            </Button>
            <Button size="lg" variant="outline">
              <FileText className="h-5 w-5 mr-2" /> Download Case Studies
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AnimationsPage;
