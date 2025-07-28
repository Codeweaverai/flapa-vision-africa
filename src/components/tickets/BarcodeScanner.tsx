
import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, X, Scan } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose, isOpen }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (isOpen && !scannerRef.current) {
      startScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = () => {
    if (scannerRef.current) {
      stopScanner();
    }

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        qrbox: {
          width: 250,
          height: 250,
        },
        fps: 10,
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        defaultZoomValueIfSupported: 1,
      },
      false
    );

    scanner.render(
      (decodedText) => {
        onScan(decodedText);
        stopScanner();
      },
      (errorMessage) => {
        // Handle scan errors silently
        console.log('Scan error:', errorMessage);
      }
    );

    scannerRef.current = scanner;
    setScanning(true);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
        scannerRef.current = null;
        setScanning(false);
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5" />
              Scan Ticket QR Code
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-gradient-to-r from-orange-500 to-purple-600 p-3 rounded-full">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Position the QR code within the frame to scan
              </p>
            </div>

            <div className="relative">
              <div id="qr-reader" className="w-full"></div>
              {scanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-lg">
                  <div className="text-white text-center">
                    <div className="animate-pulse">
                      <Scan className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Scanning...</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BarcodeScanner;
