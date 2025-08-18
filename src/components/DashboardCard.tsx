
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
  onClick?: () => void;
  children?: React.ReactNode;
}

const DashboardCard = ({
  title,
  description,
  icon,
  className,
  footer,
  onClick,
  children,
}: DashboardCardProps) => {
  return (
    <Card 
      className={cn("transition-all hover:shadow-md", 
      onClick ? "cursor-pointer" : "", 
      className)}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
          {icon && <div className="text-primary">{icon}</div>}
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
      {footer && <CardFooter className="pt-2">{footer}</CardFooter>}
    </Card>
  );
};

export default DashboardCard;
