import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TeacherEvaluationReport } from '@/components/TeacherEvaluationReport';
import { OverallEvaluationPrint } from '@/components/OverallEvaluationPrint';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

export default function Documents() {
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [teacherResults, setTeacherResults] = useState([]);
  const [evaluationPeriod, setEvaluationPeriod] = useState('');
  const [showIndividual, setShowIndividual] = useState(false);
  const [showOverall, setShowOverall] = useState(false);
  const [individualReport, setIndividualReport] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadEvaluatedTeachers();
  }, []);

  const loadData = async () => {
    try {
      // Load evaluation settings
      const { data: settings } = await supabase
        .from('evaluation_settings')
        .select('current_semester, school_year')
        .single();
      
      if (settings) {
        setEvaluationPeriod(`${settings.current_semester} ${settings.school_year}`);
      }

      // Load teachers and results
      const { data: results } = await supabase
        .from('teacher_evaluation_results')
        .select(`
          *,
          teachers(name)
        `);

      setTeacherResults(results || []);
      
      const uniqueTeachers = results?.reduce((acc, result) => {
        if (!acc.find(t => t.id === result.teacher_id)) {
          acc.push({
            id: result.teacher_id,
            name: result.teachers?.name || 'Unknown'
          });
        }
        return acc;
      }, []) || [];
      
      setTeachers(uniqueTeachers);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load evaluation data",
        variant: "destructive",
      });
    }
  };

  // Fetch evaluated teachers from evaluations table and match with teachers table
  const loadEvaluatedTeachers = async () => {
    try {
      // Get all teacher_ids from evaluations
      const { data: evaluations } = await supabase
        .from('evaluations')
        .select('teacher_id');
      console.log('Evaluations:', evaluations);
      // Filter out null teacher_ids
      const uniqueTeacherIds = Array.from(new Set((evaluations || []).map(e => e.teacher_id).filter(Boolean)));
      if (uniqueTeacherIds.length === 0) {
        setTeachers([]);
        return;
      }
      // Fetch teacher names from teachers table
      const { data: teacherData } = await supabase
        .from('teachers')
        .select('id, name')
        .in('id', uniqueTeacherIds);
      console.log('TeacherData:', teacherData);
      const teacherList = (teacherData || []).map(t => ({ id: t.id, name: t.name }));
      setTeachers(teacherList);
    } catch (error) {
      console.error('Error loading evaluated teachers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load evaluated teachers',
        variant: 'destructive',
      });
    }
  };

  const computeResults = async () => {
    try {
      await supabase.functions.invoke('compute-evaluation-results');
      await loadData();
      toast({
        title: "Success",
        description: "Evaluation results computed successfully",
      });
    } catch (error) {
      console.error('Error computing results:', error);
      toast({
        title: "Error",
        description: "Failed to compute results",
        variant: "destructive",
      });
    }
  };

  // Handler for Generate Individual Report (Excel export)
  const handleGenerateIndividualReport = async () => {
    if (!selectedTeacher) return;
    // Fetch teacher data
    const { data: teacherData } = await supabase
      .from('teachers')
      .select('id, name, department, level')
      .eq('id', selectedTeacher)
      .single();
    // Fetch all evaluations for this teacher
    const { data: evaluations, error } = await supabase
      .from('evaluations')
      .select('overall_rating, positive_feedback, suggestions, teacher_id')
      .eq('teacher_id', selectedTeacher);
    if (!teacherData || !evaluations || evaluations.length === 0) {
      toast({ title: 'No data', description: 'No evaluations found for this teacher.' });
      return;
    }
    // Prepare data for Excel
    // Use the first evaluation's overall_rating as the overall result
    const overallResult = evaluations[0].overall_rating;
    const commentsTable = evaluations.map(e => ({
      'Good Comment': e.positive_feedback || '',
      'Need Improvement': e.suggestions || ''
    }));
    // Create worksheet
    const wsData = [
      ['Teacher Name', teacherData.name],
   
      ['Overall Result', overallResult],
      [],
      ['Good Comment', 'Need Improvement'],
      ...commentsTable.map(row => [row['Good Comment'], row['Need Improvement']])
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `Teacher_Report_${teacherData.name}.xlsx`);
  };

  // Handler for Generate Overall Report (Excel export)
  const handleGenerateOverallReport = async () => {
    // Fetch all teachers
    const { data: allTeachers } = await supabase
      .from('teachers')
      .select('id, name');
    // Fetch all evaluations
    const { data: allEvaluations } = await supabase
      .from('evaluations')
      .select('teacher_id, overall_rating, positive_feedback, suggestions');
    // Group evaluations by teacher
    const teacherMap = new Map();
    (allTeachers || []).forEach(t => {
      teacherMap.set(t.id, { name: t.name, evaluations: [] });
    });
    (allEvaluations || []).forEach(e => {
      if (teacherMap.has(e.teacher_id)) {
        teacherMap.get(e.teacher_id).evaluations.push(e);
      }
    });
    // Prepare summary data for Excel
    const summaryData = [['Teacher Name', 'Overall Result', 'Total Evaluations']];
    const chartData = [];
    teacherMap.forEach((value, key) => {
      const overallAvg = value.evaluations.length > 0 ?
        (value.evaluations.reduce((sum, e) => sum + (e.overall_rating || 0), 0) / value.evaluations.length).toFixed(2)
        : 'N/A';
      summaryData.push([value.name, overallAvg, value.evaluations.length]);
      chartData.push({ name: value.name, overall: parseFloat(overallAvg) || 0 });
    });
    // Prepare detailed data
    const detailsData = [['Teacher Name', 'Overall Rating', 'Good Comment', 'Need Improvement']];
    teacherMap.forEach((value) => {
      value.evaluations.forEach(e => {
        detailsData.push([value.name, e.overall_rating, e.positive_feedback || '', e.suggestions || '']);
      });
    });
    // Create workbook and sheets
    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    const wsDetails = XLSX.utils.aoa_to_sheet(detailsData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
    XLSX.utils.book_append_sheet(wb, wsDetails, 'Details');
    // Add a simple bar chart for overall results (Excel will render it)
    // xlsx does not natively support chart creation, but you can add chart data for manual charting in Excel
    const chartSheetData = [['Teacher Name', 'Overall Result']].concat(chartData.map(d => [d.name, d.overall]));
    const wsChart = XLSX.utils.aoa_to_sheet(chartSheetData);
    XLSX.utils.book_append_sheet(wb, wsChart, 'ChartData');
    XLSX.writeFile(wb, 'Overall_Teacher_Evaluations.xlsx');
  };

  const selectedTeacherResult = teacherResults.find(r => r.teacher_id === selectedTeacher);
  const teacherSummaries = teacherResults.map(r => ({
    teacher_name: r.teachers?.name || 'Unknown',
    overall_rating: r.overall_rating,
    total_evaluations: r.total_evaluations
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Individual Teacher Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
              <SelectTrigger>
                <SelectValue placeholder="Select a teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleGenerateIndividualReport}
              disabled={!selectedTeacher}
              className="w-full"
            >
              Generate Individual Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overall Results Report</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleGenerateOverallReport}
              className="w-full"
            >
              Generate Overall Report
            </Button>
          </CardContent>
        </Card>
      </div>

        {showIndividual && selectedTeacherResult && (
          <TeacherEvaluationReport
            teacherResult={selectedTeacherResult}
            evaluationPeriod={evaluationPeriod}
          />
        )}

      {showOverall && teacherSummaries.length > 0 && (
        <OverallEvaluationPrint
          teacherSummaries={teacherSummaries}
          evaluationPeriod={evaluationPeriod}
        />
      )}
    </div>
  );
}