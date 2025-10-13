import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Clock, 
  Calendar, 
  DollarSign, 
  ArrowLeft, 
  Mail,
  ExternalLink,
  Building,
  Users,
  Star,
  Zap,
  Target,
  Heart,
  CheckCircle,
  Globe,
  Award
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface JobOpening {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  description: string;
  requirements: string;
  responsibilities?: string;
  salary_range?: string;
  benefits?: string;
  application_deadline?: string;
  is_active: boolean;
  created_at: string;
}

const JobDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<JobOpening | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchJobDetails();
    }
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('job_openings')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setJob(data);
    } catch (error) {
      console.error('Error fetching job details:', error);
      toast.error('Job opening not found');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyByEmail = () => {
    const subject = encodeURIComponent(`Application for ${job?.title} Position`);
    const body = encodeURIComponent(`Dear Hiring Team,

I am writing to express my interest in the ${job?.title} position at SkillPulse. 

Please find my resume and cover letter attached to this email.

Thank you for considering my application.

Best regards,
[Your Name]`);
    
    window.location.href = `mailto:jobs@skillpulse.cloud?subject=${subject}&body=${body}`;
  };

  const companyBenefits = [
    "Competitive salary and equity",
    "Flexible remote work environment",
    "Health, dental, and vision insurance",
    "Unlimited learning budget",
    "Professional development opportunities",
    "Team retreats and events",
    "Latest tech equipment",
    "Mental health support"
  ];

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">Loading amazing opportunity...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!job) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center mx-auto mb-6">
              <Heart className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Opportunity Not Found
            </h1>
            <p className="text-slate-600 mb-8 text-lg">
              This position is no longer available, but we have many other amazing opportunities waiting for you.
            </p>
            <Button 
              asChild 
              className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Link to="/careers">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Explore All Positions
              </Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
      <Layout>
        {/* Enhanced Hero Section */}
        <section className="relative py-16 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-purple-600/5 to-transparent" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-300/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-400/10 rounded-full -translate-x-1/2 translate-y-1/2 blur-3xl" />
          
          <div className="container mx-auto relative z-10">
            <Button 
              variant="outline" 
              asChild 
              className="mb-8 border-slate-200 text-slate-600 hover:bg-white/50 backdrop-blur-sm"
            >
              <Link to="/careers">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Careers
              </Link>
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white">
                  <div className="space-y-6">
                    <div>
                      <Badge className="mb-4 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-purple-600 text-white border-0">
                        🚀 Hiring Now
                      </Badge>
                      <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                        {job.title}
                      </h1>
                      
                      {/* Enhanced Job Meta */}
                      <div className="flex flex-wrap gap-4 mb-6">
                        <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-2xl border border-orange-100">
                          <Building className="h-4 w-4 text-orange-600" />
                          <span className="font-semibold text-orange-700">{job.department}</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-2xl border border-purple-100">
                          <MapPin className="h-4 w-4 text-purple-600" />
                          <span className="font-semibold text-purple-700">{job.location}</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-2xl border border-green-100">
                          <Clock className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-green-700">{job.employment_type}</span>
                        </div>
                        {job.salary_range && (
                          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-2xl border border-blue-100">
                            <DollarSign className="h-4 w-4 text-blue-600" />
                            <span className="font-semibold text-blue-700">{job.salary_range}</span>
                          </div>
                        )}
                      </div>

                      {job.application_deadline && (
                        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-purple-50 rounded-2xl border border-orange-100">
                          <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-600">Application Deadline</p>
                            <p className="font-bold text-orange-600">
                              {new Date(job.application_deadline).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Enhanced Content Sections */}
                <div className="space-y-8">
                  {/* Job Description */}
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden group hover:shadow-2xl transition-all duration-500">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center">
                          <Target className="h-5 w-5 text-white" />
                        </div>
                        <CardTitle className="text-2xl bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                          Job Description
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-lg max-w-none">
                        <p className="text-slate-700 leading-relaxed text-lg whitespace-pre-line">
                          {job.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Separator className="my-8" />

                  {/* Requirements */}
                  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden group hover:shadow-2xl transition-all duration-500">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center">
                          <Star className="h-5 w-5 text-white" />
                        </div>
                        <CardTitle className="text-2xl bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                          Requirements
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-lg max-w-none">
                        <p className="text-slate-700 leading-relaxed text-lg whitespace-pre-line">
                          {job.requirements}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {job.responsibilities && (
                    <>
                      <Separator className="my-8" />
                      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden group hover:shadow-2xl transition-all duration-500">
                        <CardHeader className="pb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center">
                              <Zap className="h-5 w-5 text-white" />
                            </div>
                            <CardTitle className="text-2xl bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                              Responsibilities
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="prose prose-lg max-w-none">
                            <p className="text-slate-700 leading-relaxed text-lg whitespace-pre-line">
                              {job.responsibilities}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>
              </div>

              {/* Enhanced Sidebar */}
              <div className="space-y-8">
                {/* Apply Card */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden group hover:shadow-3xl transition-all duration-500">
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-2xl bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                      Ready to Apply?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center space-y-4">
                      <div className="p-6 bg-gradient-to-br from-orange-50 to-purple-50 rounded-2xl border border-orange-100 group-hover:from-orange-100 group-hover:to-purple-100 transition-all duration-500">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                          <Mail className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="font-bold text-lg mb-2 text-slate-800">Email Application</h3>
                        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                          Send your resume and cover letter directly to our HR team
                        </p>
                        <Button 
                          onClick={handleApplyByEmail}
                          className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-lg py-6"
                        >
                          <Mail className="h-5 w-5 mr-2" />
                          Apply Now
                        </Button>
                      </div>
                      
                      <div className="text-sm text-slate-500 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="font-medium mb-1">Prefer to email directly?</p>
                        <p className="text-purple-600 font-semibold">jobs@skillpulse.cloud</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Company Benefits */}
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center">
                        <Award className="h-4 w-4 text-white" />
                      </div>
                      Why SkillPulse?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {companyBenefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors duration-200">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm text-slate-700 font-medium">{benefit}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* About SkillPulse */}
                <Card className="bg-gradient-to-br from-orange-500 to-purple-600 text-white border-0 shadow-2xl rounded-3xl overflow-hidden">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                        <Globe className="h-4 w-4 text-white" />
                      </div>
                      Join Our Mission
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-white/90 leading-relaxed">
                      Be part of a team that's transforming education and empowering creators worldwide through innovative technology.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      asChild 
                      className="w-full bg-white/10 border-white/20 text-white hover:bg-white hover:text-purple-600 backdrop-blur-sm"
                    >
                      <Link to="/about">
                        Our Story
                        <ExternalLink className="h-3 w-3 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced CTA Section */}
        <section className="py-16 px-4 bg-gradient-to-r from-orange-500 via-purple-600 to-orange-500 bg-size-200 animate-gradient text-white">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Make an Impact?
            </h2>
            <p className="text-xl mb-8 opacity-95 font-light max-w-2xl mx-auto">
              Join us in building the future of education. Your next career adventure starts here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                variant="secondary" 
                className="text-lg px-8 py-6 bg-white text-slate-800 hover:bg-slate-100 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300 font-semibold"
                onClick={handleApplyByEmail}
              >
                <Mail className="h-5 w-5 mr-2" />
                Apply for this Position
              </Button>
              <Button 
                size="lg"
                variant="outline" 
                className="text-lg px-8 py-6 bg-transparent border-2 border-white text-white hover:bg-white hover:text-purple-600 transition-all duration-300 font-semibold"
                asChild
              >
                <Link to="/careers">
                  Explore Other Roles
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </Layout>

      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
          background-size: 200% 200%;
        }
        .bg-size-200 {
          background-size: 200% 200%;
        }
      `}</style>
    </div>
  );
};

export default JobDetailPage;
