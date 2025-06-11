
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Shield, Search } from 'lucide-react';
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
  const [result, setResult] = useState<{ valid: boolean; details?: CertificateDetails; error?: string } | null>(null);

  const handleVerify = async () => {
    if (!verificationCode.trim()) {
      toast.error('Please enter a verification code');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('verify-certificate', {
        body: { code: verificationCode.trim() }
      });

      if (error) {
        throw error;
      }

      setResult(data);
      
      if (data.valid) {
        toast.success('Certificate verified successfully!');
      } else {
        toast.error('Certificate not found or invalid');
      }
    } catch (error) {
      console.error('Error verifying certificate:', error);
      setResult({ valid: false, error: 'Failed to verify certificate' });
      toast.error('Failed to verify certificate');
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
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-purple-100 to-pink-100">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                Certificate Verification
              </h1>
              <p className="text-lg text-gray-600">
                Verify the authenticity of SkillPulse certificates using the verification code
              </p>
            </div>

            <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-6 w-6 text-orange-500" />
                  Verify Certificate
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="verificationCode">Verification Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="verificationCode"
                      placeholder="Enter verification code (e.g., SP-ABC123-XYZ)"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1"
                      disabled={loading}
                    />
                    <Button 
                      onClick={handleVerify} 
                      disabled={loading || !verificationCode.trim()}
                      className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                      {loading ? 'Verifying...' : 'Verify'}
                    </Button>
                  </div>
                </div>

                {result && (
                  <Card className={`${result.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-4">
                        {result.valid ? (
                          <>
                            <CheckCircle className="h-8 w-8 text-green-600" />
                            <div>
                              <h3 className="text-lg font-semibold text-green-800">Certificate Valid</h3>
                              <p className="text-green-600">This certificate is authentic and verified</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-8 w-8 text-red-600" />
                            <div>
                              <h3 className="text-lg font-semibold text-red-800">Certificate Invalid</h3>
                              <p className="text-red-600">
                                {result.error || 'This certificate could not be verified'}
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      {result.valid && result.details && (
                        <div className="space-y-3 border-t pt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium text-gray-600">Student Name</Label>
                              <p className="font-semibold">{result.details.studentName}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-600">Course</Label>
                              <p className="font-semibold">{result.details.courseName}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-600">Issue Date</Label>
                              <p className="font-semibold">{result.details.issueDate}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-gray-600">Verification Code</Label>
                              <Badge variant="outline" className="font-mono">
                                {result.details.verificationCode}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">How to verify:</h4>
                  <ol className="text-sm text-gray-600 space-y-1">
                    <li>1. Enter the verification code found on the certificate</li>
                    <li>2. Click "Verify" to check authenticity</li>
                    <li>3. View certificate details if valid</li>
                  </ol>
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
