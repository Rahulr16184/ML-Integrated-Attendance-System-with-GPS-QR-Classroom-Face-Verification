
"use client";

import * as React from 'react';
import { cn } from '@/lib/utils';
import { MapPin, Camera, UserCheck, CheckCircle, QrCode } from 'lucide-react';

const STEPS_MODE_1 = [
    { id: 'gps', title: 'GPS', icon: MapPin },
    { id: 'classroom', title: 'Classroom', icon: Camera },
    { id: 'face', title: 'Face', icon: UserCheck },
];

const STEPS_MODE_2 = [
    { id: 'qr', title: 'QR Code', icon: QrCode },
    { id: 'face', title: 'Face', icon: UserCheck },
];


interface VerificationStepsProps {
    currentStep: number; // 0 for GPS/QR, 1 for Classroom/Face, 2 for Face
    mode?: 1 | 2;
}

export function VerificationSteps({ currentStep, mode = 1 }: VerificationStepsProps) {
  const steps = mode === 1 ? STEPS_MODE_1 : STEPS_MODE_2;
  
  return (
    <div className="flex justify-between items-center max-w-2xl mx-auto">
        {steps.map((step, index) => (
            <React.Fragment key={step.id}>
                <div className="flex flex-col items-center gap-2 text-center w-20">
                    <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center transition-colors', 
                        currentStep > index ? 'bg-green-500 text-white' : 
                        currentStep === index ? 'bg-primary text-primary-foreground' : 
                        'bg-muted text-muted-foreground'
                    )}>
                        {currentStep > index ? <CheckCircle /> : <step.icon />}
                    </div>
                    <span className={cn(
                        "text-xs font-medium transition-colors",
                         currentStep > index ? 'text-green-600' :
                         currentStep === index ? 'text-primary' :
                         'text-muted-foreground'
                    )}>{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                     <div className={cn(
                         "flex-1 h-1 mx-2 transition-colors",
                         currentStep > index ? 'bg-green-500' : 'bg-muted'
                      )}></div>
                )}
            </React.Fragment>
        ))}
    </div>
  );
}
