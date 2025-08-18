import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Legend, Bar } from "recharts";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export interface ChartData {
  name: string;
  rating: number;
  students: number;
}

interface ChartDisplayProps {
  title: string;
  description?: string;
  customData?: ChartData[];
}

// Define proper types for tooltip props
interface CustomTooltipProps {
  active?: boolean;
  payload?: ChartData[];
  label?: string;
}

const ChartDisplay = ({ title, description, customData }: ChartDisplayProps) => {
  const [chartFilter, setChartFilter] = React.useState("all");

  // Log customData for debugging
  console.log("ChartDisplay customData:", customData);

  // Validate customData format
  const isValidBarData = (data: ChartData[]) => {
    return data.every(item => item.name && typeof item.rating === "number" && typeof item.students === "number");
  };

  // Empty data for charts
  const emptyBarData: ChartData[] = [
    { name: "No Data", rating: 0, students: 0 },
  ];
  
  // Use custom data if provided and valid, otherwise use empty data
  const data: ChartData[] = customData && customData.length > 0
    ? isValidBarData(customData)
      ? customData
      : (console.warn("Invalid customData format for bar chart"), emptyBarData)
    : emptyBarData;

  // Function to customize the tooltip for bar charts
  const CustomBarTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border shadow-sm rounded-md">
          <p className="font-medium">{label}</p>
          <p className="text-primary">Rating: {payload[0].rating.toFixed(1)}</p>
          <p className="text-muted-foreground text-sm">Students: {
            payload[0].students || 0
          }</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="chart-filter" className="text-sm">Filter:</Label>
            <Select value={chartFilter} onValueChange={setChartFilter}>
              <SelectTrigger id="chart-filter" className="w-[140px]">
                <SelectValue placeholder="Select filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={80} 
                tick={{ fontSize: 12 }}
                interval={0}
              />
              <YAxis 
                domain={[0, 5]} 
                ticks={[0, 1, 2, 3, 4, 5]} 
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Legend />
              <Bar 
                dataKey="rating" 
                fill="#6366f1" 
                name="Average Rating" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChartDisplay;
