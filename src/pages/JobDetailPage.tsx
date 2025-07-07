
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
  Users
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

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!job) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Job Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The job opening you're looking for doesn't exist or is no longer active.
            </p>
            <Button asChild>
              <Link to="/careers">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Careers
              </Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button variant="outline" asChild className="mb-4">
              <Link to="/careers">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Careers
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <div className="space-y-4">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                      
                      {/* Static Image */}
                      <div className="mb-4">
                        <img
                          src="https://rxqoczksnddbxcdwobnw.supabase.co/storage/v1/object/public/asset//female-pupil-reviewing-educational-research-collection-library.jpg"
                          alt="Career opportunity"
                          className="w-full h-64 object-cover rounded-lg"
                        />
                      </div>
                      
                      <div className="flex flex-wrap gap-3">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {job.department}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {job.location}
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {job.employment_type}
                        </Badge>
                        {job.salary_range && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {job.salary_range}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {job.application_deadline && (
                      <div className="flex items-center gap-2 text-orange-600">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Application Deadline: {new Date(job.application_deadline).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-3">Job Description</h2>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700 whitespace-pre-line">{job.description}</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h2 className="text-xl font-semibold mb-3">Requirements</h2>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700 whitespace-pre-line">{job.requirements}</p>
                    </div>
                  </div>

                  {job.responsibilities && (
                    <>
                      <Separator />
                      <div>
                        <h2 className="text-xl font-semibold mb-3">Responsibilities</h2>
                        <div className="prose prose-sm max-w-none">
                          <p className="text-gray-700 whitespace-pre-line">{job.responsibilities}</p>
                        </div>
                      </div>
                    </>
                  )}

                  {job.benefits && (
                    <>
                      <Separator />
                      <div>
                        <h2 className="text-xl font-semibold mb-3">Benefits</h2>
                        <div className="prose prose-sm max-w-none">
                          <p className="text-gray-700 whitespace-pre-line">{job.benefits}</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-center">Apply for this Position</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center space-y-4">
                    <div className="p-4 bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg">
                      <Mail className="h-12 w-12 mx-auto mb-3 text-purple-600" />
                      <h3 className="font-semibold mb-2">Email Application</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Send your resume and cover letter to our HR team
                      </p>
                      <Button 
                        onClick={handleApplyByEmail}
                        className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Apply via Email
                      </Button>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      <p>Or send your application directly to:</p>
                      <p className="font-medium text-purple-600">jobs@skillpulse.cloud</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    About SkillPulse
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Join our mission to democratize education and empower creators worldwide. 
                    We're building the next generation of learning platforms.
                  </p>
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link to="/about">
                      Learn More About Us
                      <ExternalLink className="h-3 w-3 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    </div>
  );
};

export default JobDetailPage;
