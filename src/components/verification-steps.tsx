
"use client";

import * as React from 'react';
import { cn } from '@/lib/utils';
import { MapPin, Camera, UserCheck, CheckCircle } from 'lucide-react';

const STEPS = [
    { id: 'gps', title: 'GPS', icon: MapPin },
    { id: 'classroom', title: 'Classroom', icon: Camera },
    { id: 'face', title: 'Face', icon: UserCheck },
];

interface VerificationStepsProps {
    currentStep: number; // 0 for GPS, 1 for Classroom, 2 for Face
}

export function VerificationSteps({ currentStep }: VerificationStepsProps) {
  return (
    <div className="flex justify-between items-center max-w-2xl mx-auto">
        {STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
                <div className="flex flex-col items-center gap-2">
                    <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center', 
                        currentStep > index ? 'bg-green-500 text-white' : 
                        currentStep === index ? 'bg-primary text-primary-foreground' : 
                        'bg-muted text-muted-foreground'
                    )}>
                        {currentStep > index ? <CheckCircle /> : <step.icon />}
                    </div>
                    <span className={cn(
                        "text-xs font-medium",
                         currentStep > index ? 'text-green-600' :
                         currentStep === index ? 'text-primary' :
                         'text-muted-foreground'
                    )}>{step.title}</span>
                </div>
                {index < STEPS.length - 1 && (
                     <div className={cn(
                         "flex-1 h-1 mx-2",
                         currentStep > index ? 'bg-green-500' : 'bg-muted'
                      )}></div>
                )}
            </React.Fragment>
        ))}
    </div>
  );
}
