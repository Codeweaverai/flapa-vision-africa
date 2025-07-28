
import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, X, Scan } from 'lucide-react';
import { toast } from 'sonner';

interface BarcodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      supportedScanTypes: [
        Html5QrcodeScanType.SCAN_TYPE_QR_CODE,
        Html5QrcodeScanType.SCAN_TYPE_BARCODE
      ]
    };

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      config,
      false
    );

    scanner.render(
      (decodedText) => {
        setIsScanning(false);
        scanner.clear();
        
        // Try to parse as JSON first (for QR codes with ticket data)
        try {
          const ticketData = JSON.parse(decodedText);
          if (ticketData.ticketCode) {
            onScan(ticketData.ticketCode);
            toast.success('Ticket code scanned successfully!');
          } else if (ticketData.bookingCode) {
            onScan(ticketData.bookingCode);
            toast.success('Booking code scanned successfully!');
          } else {
            onScan(decodedText);
            toast.success('Code scanned successfully!');
          }
        } catch {
          // If not JSON, treat as plain text (barcode)
          onScan(decodedText);
          toast.success('Code scanned successfully!');
        }
      },
      (error) => {
        // Handle scan errors silently (common during scanning)
        console.log('Scan error:', error);
      }
    );

    scannerRef.current = scanner;
    setIsScanning(true);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, [onScan]);

  const handleStop = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      setIsScanning(false);
    }
    onClose();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scan Ticket Code
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStop}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <Scan className="h-12 w-12 mx-auto mb-2 text-orange-500" />
            <p className="text-sm text-gray-600">
              Point your camera at the QR code or barcode on the ticket
            </p>
          </div>
          
          <div id="qr-reader" className="w-full"></div>
          
          {isScanning && (
            <div className="text-center">
              <div className="animate-pulse text-orange-600 text-sm">
                Scanning... Please hold steady
              </div>
            </div>
          )}
          
          <div className="text-xs text-gray-500 text-center">
            <p>• Supports QR codes and standard barcodes</p>
            <p>• Ensure good lighting for better scanning</p>
            <p>• Hold the device steady</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BarcodeScanner;
