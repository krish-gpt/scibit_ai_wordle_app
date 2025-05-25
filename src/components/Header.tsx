import { BrainCircuit } from 'lucide-react';
import ToolsSidebar, { ToolsSidebarProps } from './game/ToolsSidebar';

const Header: React.FC<ToolsSidebarProps> = ({ clue }) => {
  return (
    <header className="flex flex-col items-center justify-center p-4 border-b border-border w-full">
      <div className="flex items-center space-x-3">
        <BrainCircuit className="h-10 w-10 text-primary" />
        <h1 className="text-4xl font-bold text-primary tracking-tight">
          SciBit
        </h1>
      </div>
      <p className="text-muted-foreground mt-1">Guess the daily AI-related term!</p>
      <ToolsSidebar clue={clue} />
    </header>
  );
};

export default Header;
