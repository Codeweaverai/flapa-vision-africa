
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Search, CheckCircle, XCircle, Award } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CertificateDetails {
  valid: boolean;
  details?: {
    studentName: string;
    courseName: string;
    issueDate: string;
    verificationCode: string;
    certificateId: string;
  };
  error?: string;
}

const VerifyCertificatePage = () => {
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CertificateDetails | null>(null);

  const handleVerify = async () => {
    if (!verificationCode.trim()) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/verify-certificate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: verificationCode.trim() }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error verifying certificate:', error);
      setResult({
        valid: false,
        error: 'An error occurred while verifying the certificate. Please try again.'
      });
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
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Shield className="h-8 w-8 text-blue-600" />
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Verify Certificate
                </h1>
              </div>
              <p className="text-lg text-gray-600 max-w-xl mx-auto">
                Enter a verification code to authenticate a SkillPulse certificate
              </p>
            </div>

            <Card className="bg-white/80 backdrop-blur-sm border-blue-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  Certificate Verification
                </CardTitle>
                <CardDescription>
                  Enter the verification code found on the certificate to check its authenticity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="verification-code" className="text-sm font-medium text-gray-700">
                    Verification Code
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="verification-code"
                      type="text"
                      placeholder="Enter verification code (e.g., CERT-ABC123)"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleVerify}
                      disabled={!verificationCode.trim() || loading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Verify
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {result && (
                  <div className="mt-6">
                    {result.valid && result.details ? (
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                Valid Certificate
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">Student Name:</span>
                                <p className="text-gray-900">{result.details.studentName}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Course:</span>
                                <p className="text-gray-900">{result.details.courseName}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Issue Date:</span>
                                <p className="text-gray-900">{result.details.issueDate}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Certificate ID:</span>
                                <p className="text-gray-900 font-mono">{result.details.certificateId}</p>
                              </div>
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert className="border-red-200 bg-red-50">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                                Invalid Certificate
                              </Badge>
                            </div>
                            <p className="text-red-700">
                              {result.error || 'The verification code entered is not valid or the certificate could not be found.'}
                            </p>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                <div className="text-sm text-gray-500 space-y-2">
                  <p className="font-medium">How to find your verification code:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>The verification code is printed on your certificate</li>
                    <li>It typically starts with "CERT-" followed by alphanumeric characters</li>
                    <li>The code is case-sensitive</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 text-center">
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Need Help?</h3>
                  <p className="text-gray-600 mb-4">
                    If you're having trouble verifying your certificate or need assistance, please contact our support team.
                  </p>
                  <Button variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50">
                    Contact Support
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default VerifyCertificatePage;
