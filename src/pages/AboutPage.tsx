
import Layout from '@/components/layout/Layout';
import { User, Award, BookOpen, Map, Briefcase, Globe, Layers, Heart, Star } from 'lucide-react';
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
              Founder & CEO of FlapaBay | African Innovation Leader | Technical & Finance Expert based in Lusaka Province, Zambia.
              An innovative thinker, seasoned expert, and passionate leader dedicated to transforming Africa's travel and fintech landscape.
            </p>
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <Map className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold text-lg">Vision</h3>
                  <p>Bridging the gap between technology and social impact, creating sustainable growth and opportunities across Africa.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Briefcase className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold text-lg">Industry Experience</h3>
                  <p>Over 10 years of experience in technical innovation, financial expertise, travel and tourism management, and leadership development.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BookOpen className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold text-lg">Education</h3>
                  <p>ACCA Full Professional Qualification in Accounting and Finance, Certified Financial Analyst, Project Management and Software Development certifications.</p>
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
          <div className="space-y-6">
            <div className="bg-card rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row md:justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold">Founder & Chief Executive Officer</h3>
                  <p className="text-primary font-medium">FlapaBay Group</p>
                </div>
                <div className="text-muted-foreground mt-1">December 2020 - Present</div>
              </div>
              <p>
                As Founder & CEO of FlapaBay Group and its subsidiaries, Mbolela ensures overall success of the organization 
                and takes a leading role in the development and execution of long-term corporate strategies, with the goal of 
                increasing shareholder value.
              </p>
            </div>

            <div className="bg-card rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row md:justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold">Finance and Administration Officer</h3>
                  <p className="text-primary font-medium">Act!on for Nature</p>
                </div>
                <div className="text-muted-foreground mt-1">January 2020 - December 2020</div>
              </div>
              <p>
                Managed the NGO's finances, project management and fundraising in Lusaka.
              </p>
            </div>

            <div className="bg-card rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row md:justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold">Senior Auditor</h3>
                  <p className="text-primary font-medium">Grant Thornton LLP</p>
                </div>
                <div className="text-muted-foreground mt-1">January 2015 - December 2019</div>
              </div>
              <p>
                Responsible for analyzing and communicating financial information for companies, local, federal and state government 
                as well as individual clients. Reviewed company operations to ensure compliance with corporate and government policies.
                Oversaw fieldwork, planning and reporting of audit assignments to the audit manager and partner.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="heading-md mb-8">Key Expertise & Skills</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <Layers className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Technical Innovation</h3>
              <p>
                Expert in leveraging technology for business optimization, logistics innovation, 
                and creating accessible solutions for underserved markets.
              </p>
            </div>
            <div className="bg-card rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <Star className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Financial Expertise</h3>
              <p>
                Strong financial analysis skills, certified chartered accountant with experience
                in corporate financial statement analysis and financial modeling.
              </p>
            </div>
            <div className="bg-card rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <Heart className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Social Impact</h3>
              <p>
                Dedicated to harnessing innovation for social good, driving economic growth, 
                and fostering community development across Africa.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="heading-md mb-8">Education & Certifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-card rounded-lg p-6 shadow-md">
              <h3 className="text-xl font-semibold mb-4">Education</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-2">
                  <Award className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">ACCA Full Professional Qualification</p>
                    <p className="text-sm text-muted-foreground">Accounting and Finance (2012 - 2015)</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Award className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">Philanthropy University</p>
                    <p className="text-sm text-muted-foreground">Fundamentals of Project Management & Fundraising Strategies (2020)</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Award className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">LinkedIn Learning</p>
                    <p className="text-sm text-muted-foreground">Software and Web Developer, Computer Programming (2020)</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="bg-card rounded-lg p-6 shadow-md">
              <h3 className="text-xl font-semibold mb-4">Certifications</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-2">
                  <Award className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">Financial Modelling Foundations</p>
                    <p className="text-sm text-muted-foreground">National Association of State Boards of Accountancy (NASBA) USA</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Award className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">Certified Chartered Accountant</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Award className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">Corporate Financial Statement Analysis</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <Award className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <p className="font-medium">Managerial Economics</p>
                    <p className="text-sm text-muted-foreground">Project Management Institute</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <h2 className="heading-md mb-8">Mission Statement</h2>
          <div className="bg-muted rounded-lg p-8">
            <p className="text-xl italic text-center">
              "My mission is to connect people, places, and possibilities across Africa. 
              Through technological innovation and strategic vision, I'm dedicated to 
              harnessing technology for social good, driving economic growth, and fostering community development."
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AboutPage;
