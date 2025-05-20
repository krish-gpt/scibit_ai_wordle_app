import { BrainCircuit } from 'lucide-react';
import type { FC } from 'react';

const Header: FC = () => {
  return (
    <header className="flex flex-col items-center justify-center p-2 sm:p-4 border-b border-border w-full">
      <div className="flex items-center space-x-2 sm:space-x-3">
        <BrainCircuit className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
        <h1 className="text-2xl sm:text-4xl font-bold text-primary tracking-tight">
          SciBit
        </h1>
      </div>
      <p className="text-sm sm:text-base text-muted-foreground mt-0.5 sm:mt-1">Guess the daily AI-related term!</p>
    </header>
  );
};

export default Header;
