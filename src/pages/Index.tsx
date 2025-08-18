
import React from 'react';
import LoginForm from '@/components/LoginForm';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 to-white">
      <div className="py-8 flex-1 flex flex-col items-center justify-center">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Teachmetrics
          </h1>

          <div className="h-1 w-24 mx-auto mt-3 bg-gradient-to-r from-primary to-secondary"></div>
        </div>
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
      <footer className="py-4 border-t">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            ACLC College of Daet © 2025 - Teachers Tabulation System
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Developed by John Carlo Monte, Kristine Joy Nisurtado & Sybreu Cereno
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
