
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Search, Shield, Award } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/lib/supabaseClient';

interface CertificateDetails {
  studentName: string;
  courseName: string;
  issueDate: string;
  verificationCode: string;
}

const VerifyPage = () => {
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [certificateDetails, setCertificateDetails] = useState<CertificateDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!verificationCode.trim()) {
      toast.error('Please enter a verification code');
      return;
    }

    setLoading(true);
    setError(null);
    setIsValid(null);
    setCertificateDetails(null);

    try {
      const { data, error } = await supabase.functions.invoke('verify-certificate', {
        body: { code: verificationCode.trim() }
      });

      if (error) throw error;

      if (data.valid) {
        setIsValid(true);
        setCertificateDetails(data.details);
        toast.success('Certificate verified successfully!');
      } else {
        setIsValid(false);
        setError(data.error || 'Certificate not found');
        toast.error('Certificate verification failed');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setIsValid(false);
      setError('Failed to verify certificate. Please try again.');
      toast.error('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-pink-100">
      <Layout>
        <div className="container max-w-4xl mx-auto py-12">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="h-8 w-8 text-orange-500" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                Certificate Verification
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Verify the authenticity of SkillPulse certificates by entering the verification code below
            </p>
          </div>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-orange-500" />
                Enter Verification Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input
                  placeholder="Enter verification code (e.g., SP-ABC123-XYZ789)"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button 
                  onClick={handleVerify} 
                  disabled={loading}
                  className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Verify
                    </>
                  )}
                </Button>
              </div>
              
              <p className="text-sm text-gray-500">
                Verification codes are typically in the format: SP-XXXXX-XXXXX
              </p>
            </CardContent>
          </Card>

          {/* Results */}
          {isValid !== null && (
            <Card className={`bg-white/90 backdrop-blur-sm border-0 shadow-xl ${
              isValid ? 'border-green-200' : 'border-red-200'
            }`}>
              <CardContent className="pt-6">
                {isValid ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                      <div>
                        <h3 className="text-xl font-semibold text-green-800">Certificate Verified</h3>
                        <p className="text-green-600">This certificate is authentic and valid</p>
                      </div>
                    </div>

                    {certificateDetails && (
                      <div className="bg-green-50 p-6 rounded-lg space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Award className="h-5 w-5 text-green-600" />
                          <h4 className="font-semibold text-green-800">Certificate Details</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Student Name</label>
                            <p className="text-lg font-semibold">{certificateDetails.studentName}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Course</label>
                            <p className="text-lg font-semibold">{certificateDetails.courseName}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Issue Date</label>
                            <p className="text-lg font-semibold">{certificateDetails.issueDate}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Verification Code</label>
                            <p className="text-lg font-mono">{certificateDetails.verificationCode}</p>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-green-200">
                          <Badge variant="default" className="bg-green-600">
                            ✓ Verified by SkillPulse
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <XCircle className="h-8 w-8 text-red-500" />
                      <div>
                        <h3 className="text-xl font-semibold text-red-800">Certificate Not Found</h3>
                        <p className="text-red-600">This certificate could not be verified</p>
                      </div>
                    </div>

                    {error && (
                      <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-red-700">{error}</p>
                      </div>
                    )}

                    <div className="bg-red-50 p-4 rounded-lg">
                      <h4 className="font-medium text-red-800 mb-2">Possible reasons:</h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        <li>• The verification code is incorrect or mistyped</li>
                        <li>• The certificate may have been revoked</li>
                        <li>• The certificate may not be from SkillPulse</li>
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Information Card */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl mt-8">
            <CardHeader>
              <CardTitle className="text-lg">About Certificate Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <p>
                SkillPulse certificates include a unique verification code that can be used to confirm 
                the authenticity and validity of the certificate.
              </p>
              <p>
                This verification system helps employers, institutions, and other parties verify that 
                the certificate holder has successfully completed the stated course or program.
              </p>
              <p>
                If you have any questions about certificate verification, please contact our support team.
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </div>
  );
};

export default VerifyPage;
