'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

const STEPS = [
  { id: 1, title: 'What do you want to create?' },
  { id: 2, title: 'Who do you want to help?' },
  { id: 3, title: 'What market are you interested in?' },
  { id: 4, title: 'How do you want to start?' },
];

const OPTIONS = {
  1: [
    'PDF guide', 'Workbook', 'Checklist', 'Template pack', 
    'Planner', 'Mini-course', 'Digital bundle', 'Not sure yet'
  ],
  2: [
    'Parents', 'Coaches', 'Freelancers', 'Students', 
    'Small business owners', 'Agencies', 'Fitness beginners', 'Anyone'
  ],
  3: [
    'Parenting', 'Business', 'Productivity', 'Fitness', 
    'Education', 'Beauty', 'Finance', 'Travel', 'Creators', 'AI tools', 'Relationships'
  ],
  4: [
    'Find ideas for me',
    'Analyze my idea',
    'Build a product from my idea',
    'Create sales kit',
  ]
};

export default function OnboardingFlow() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [selections, setSelections] = useState<Record<number, string>>({});

  const handleSelect = (option: string) => {
    setSelections({ ...selections, [currentStep]: option });
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      router.push('/auth/login');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Nav */}
      <header className="px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between border-b border-white/5 shrink-0">
        <Button variant="ghost" className="text-muted-foreground hover:text-white px-2 sm:px-4" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Back</span>
        </Button>
        <div className="flex gap-1.5 sm:gap-2">
          {STEPS.map((step) => (
            <div 
              key={step.id} 
              className={`h-1.5 w-6 sm:w-12 rounded-full ${step.id <= currentStep ? 'bg-primary' : 'bg-white/10'}`} 
            />
          ))}
        </div>
        <div className="w-[52px] sm:w-[88px]" /> {/* Spacer for balance */}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <h1 className="text-3xl md:text-4xl font-medium text-white mb-2 text-center">
            {STEPS[currentStep - 1].title}
          </h1>
          <p className="text-muted-foreground text-center mb-10">
            WIZUP will customize your workspace experience based on this.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-8 sm:mb-10 max-w-[420px] sm:max-w-none mx-auto">
            {(OPTIONS[currentStep as keyof typeof OPTIONS] || []).map((option) => {
              const isSelected = selections[currentStep] === option;
              return (
                <Card 
                  key={option}
                  className={`p-4 sm:p-6 cursor-pointer border transition-all min-h-[56px] flex items-center ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-white/5 bg-card hover:border-white/20'
                  }`}
                  onClick={() => handleSelect(option)}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`font-medium text-sm sm:text-base ${isSelected ? 'text-white' : 'text-muted-foreground'}`}>
                      {option}
                    </span>
                    {isSelected && <Check className="w-5 h-5 text-primary shrink-0 ml-3" />}
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-center">
            <Button 
              size="lg" 
              className="px-8 h-12 min-w-[200px]"
              disabled={!selections[currentStep]}
              onClick={handleNext}
            >
              {currentStep === 4 ? 'Start my scan' : 'Continue'}
              {currentStep !== 4 && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
