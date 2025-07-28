
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { Search, Shield, CheckCircle, XCircle, Award, Calendar, User, FileText } from 'lucide-react';

interface CertificateData {
  id: string;
  verification_code: string;
  issue_date: string;
  user: {
    full_name: string;
    email: string;
  };
  course: {
    title: string;
    creator: {
      full_name: string;
    };
  };
  enrollment: {
    completion_date: string;
  };
}

const VerifyPage = () => {
  const [verificationCode, setVerificationCode] = useState('');
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  const handleVerify = async () => {
    if (!verificationCode.trim()) {
      toast.error('Please enter a verification code');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-certificate', {
        body: { verification_code: verificationCode.trim() }
      });

      if (error) throw error;

      if (data.valid) {
        setCertificate(data.certificate);
        setIsVerified(true);
        toast.success('Certificate verified successfully!');
      } else {
        setIsVerified(false);
        toast.error('Invalid verification code');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setIsVerified(false);
      toast.error('Failed to verify certificate');
    } finally {
      setIsLoading(false);
    }
  };

  const resetVerification = () => {
    setVerificationCode('');
    setCertificate(null);
    setIsVerified(null);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-3 rounded-full">
                  <Shield className="h-8 w-8 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Certificate Verification</h1>
              <p className="text-gray-600">Verify the authenticity of SkillPulse certificates</p>
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Verify Certificate
                </CardTitle>
                <CardDescription>
                  Enter the verification code found on the certificate to verify its authenticity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="verification-code">Verification Code</Label>
                  <Input
                    id="verification-code"
                    placeholder="Enter verification code (e.g., CERT-12345678)"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="font-mono"
                    onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleVerify}
                    disabled={isLoading || !verificationCode.trim()}
                    className="bg-gradient-to-r from-orange-500 to-purple-600"
                  >
                    {isLoading ? 'Verifying...' : 'Verify Certificate'}
                  </Button>
                  <Button variant="outline" onClick={resetVerification}>
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Verification Results */}
            {isVerified !== null && (
              <Card className={`transition-all duration-300 ${
                isVerified 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-red-200 bg-red-50'
              }`}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {isVerified ? (
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      ) : (
                        <XCircle className="h-8 w-8 text-red-600" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      {isVerified ? (
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-semibold text-green-800 mb-2">
                              ✅ Certificate Verified
                            </h3>
                            <p className="text-green-700">
                              This certificate is authentic and has been verified by SkillPulse.
                            </p>
                          </div>

                          {certificate && (
                            <div className="space-y-4">
                              <Separator />
                              
                              {/* Certificate Details */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Certificate Holder
                                  </h4>
                                  <div className="space-y-2">
                                    <p className="font-medium text-lg">{certificate.user.full_name}</p>
                                    <p className="text-sm text-gray-600">{certificate.user.email}</p>
                                  </div>
                                </div>

                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <Award className="h-4 w-4" />
                                    Course Information
                                  </h4>
                                  <div className="space-y-2">
                                    <p className="font-medium">{certificate.course.title}</p>
                                    <p className="text-sm text-gray-600">
                                      Instructor: {certificate.course.creator.full_name}
                                    </p>
                                  </div>
                                </div>

                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Dates
                                  </h4>
                                  <div className="space-y-2">
                                    <div>
                                      <span className="text-sm text-gray-500">Completed:</span>
                                      <p className="font-medium">
                                        {new Date(certificate.enrollment.completion_date).toLocaleDateString()}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-sm text-gray-500">Issued:</span>
                                      <p className="font-medium">
                                        {new Date(certificate.issue_date).toLocaleDateString()}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Certificate Details
                                  </h4>
                                  <div className="space-y-2">
                                    <div>
                                      <span className="text-sm text-gray-500">Verification Code:</span>
                                      <p className="font-mono text-sm">{certificate.verification_code}</p>
                                    </div>
                                    <div>
                                      <span className="text-sm text-gray-500">Status:</span>
                                      <Badge variant="default" className="ml-2">
                                        Verified
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-lg font-semibold text-red-800 mb-2">
                            ❌ Certificate Not Found
                          </h3>
                          <p className="text-red-700">
                            The verification code you entered is invalid or the certificate may have been revoked.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Instructions */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>How to Verify</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm text-gray-600">
                  <div className="flex items-start gap-3">
                    <span className="font-semibold text-orange-600">1.</span>
                    <p>Locate the verification code on the certificate (usually at the bottom)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-semibold text-orange-600">2.</span>
                    <p>Enter the complete verification code in the field above</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-semibold text-orange-600">3.</span>
                    <p>Click "Verify Certificate" to check authenticity</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-semibold text-orange-600">4.</span>
                    <p>View the certificate details if verification is successful</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default VerifyPage;
