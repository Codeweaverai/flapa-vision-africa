
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { Search, CheckCircle, XCircle, Award, Calendar, User, BookOpen } from 'lucide-react';

interface CertificateDetails {
  studentName: string;
  courseName: string;
  issueDate: string;
  verificationCode: string;
}

const VerifyPage = () => {
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean;
    details?: CertificateDetails;
    error?: string;
  } | null>(null);

  const handleVerify = async () => {
    if (!verificationCode.trim()) {
      toast.error('Please enter a verification code');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-certificate', {
        body: { code: verificationCode.trim() }
      });

      if (error) {
        throw error;
      }

      setVerificationResult(data);
      
      if (data.valid) {
        toast.success('Certificate verified successfully!');
      } else {
        toast.error('Certificate not found or invalid');
      }
    } catch (error) {
      console.error('Error verifying certificate:', error);
      toast.error('Failed to verify certificate');
      setVerificationResult({
        valid: false,
        error: 'Failed to verify certificate'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setVerificationCode('');
    setVerificationResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Award className="h-16 w-16 mx-auto mb-4 text-orange-500" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Certificate Verification</h1>
            <p className="text-xl text-gray-600">
              Verify the authenticity of SkillPulse certificates using the verification code
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Enter Verification Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter verification code (e.g., SP-ABC123-XYZ789)"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                />
                <Button 
                  onClick={handleVerify} 
                  disabled={loading}
                  className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Verify
                    </>
                  )}
                </Button>
              </div>
              
              <p className="text-sm text-gray-500">
                The verification code can be found on the certificate document
              </p>
            </CardContent>
          </Card>

          {/* Verification Result */}
          {verificationResult && (
            <Card className={`${
              verificationResult.valid 
                ? 'border-green-200 bg-green-50' 
                : 'border-red-200 bg-red-50'
            }`}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-6">
                  {verificationResult.valid ? (
                    <>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-green-800">Certificate Valid</h3>
                        <p className="text-green-600">This certificate has been verified successfully</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-8 w-8 text-red-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-red-800">Certificate Invalid</h3>
                        <p className="text-red-600">
                          {verificationResult.error || 'This certificate could not be verified'}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {verificationResult.valid && verificationResult.details && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Student Name</p>
                          <p className="font-semibold">{verificationResult.details.studentName}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Course</p>
                          <p className="font-semibold">{verificationResult.details.courseName}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Issue Date</p>
                          <p className="font-semibold">{verificationResult.details.issueDate}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Verification Code</p>
                          <p className="font-mono text-sm">{verificationResult.details.verificationCode}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-4 bg-white rounded-lg border">
                      <Badge className="bg-green-500 mb-2">Verified</Badge>
                      <p className="text-sm text-gray-600">
                        This certificate was issued by SkillPulse Academy and represents successful 
                        completion of the specified course with professional competency standards.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-6">
                  <Button 
                    onClick={handleReset} 
                    variant="outline" 
                    className="flex-1"
                  >
                    Verify Another Certificate
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>How to Verify</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5">1</Badge>
                <div>
                  <p className="font-medium">Locate the verification code</p>
                  <p className="text-sm text-gray-600">
                    Find the verification code on the certificate document (format: SP-XXXXX-XXXXX)
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5">2</Badge>
                <div>
                  <p className="font-medium">Enter the code</p>
                  <p className="text-sm text-gray-600">
                    Type or paste the complete verification code in the field above
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5">3</Badge>
                <div>
                  <p className="font-medium">Get verification results</p>
                  <p className="text-sm text-gray-600">
                    View the certificate details and authenticity status
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VerifyPage;
