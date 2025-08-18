import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Edit, Save, X, RefreshCw } from 'lucide-react';

interface SectionCapacity {
  id: string;
  level: string;
  strand_course: string;
  section: string;
  max_capacity: number;
  current_count: number;
}

export const UpdatedSectionCountsDisplay = () => {
  const [sections, setSections] = useState<SectionCapacity[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCapacity, setEditCapacity] = useState<number>(0);
  const { toast } = useToast();

  useEffect(() => {
    loadSectionData();
  }, []);

  const loadSectionData = async () => {
    try {
      // First update the counts
      await supabase.rpc('update_section_counts');
      
      // Then fetch the updated data
      const { data, error } = await supabase
        .from('section_capacity')
        .select('*')
        .order('level, strand_course, section');

      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error('Error loading section data:', error);
      toast({
        title: "Error",
        description: "Failed to load section data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateMaxCapacity = async (id: string, newCapacity: number) => {
    try {
      const { error } = await supabase
        .from('section_capacity')
        .update({ max_capacity: newCapacity })
        .eq('id', id);

      if (error) throw error;

      setSections(sections.map(s => 
        s.id === id ? { ...s, max_capacity: newCapacity } : s
      ));
      
      setEditingId(null);
      setEditCapacity(0);
      
      toast({
        title: "Success",
        description: "Max capacity updated successfully",
      });
    } catch (error) {
      console.error('Error updating capacity:', error);
      toast({
        title: "Error",
        description: "Failed to update capacity",
        variant: "destructive",
      });
    }
  };

  const startEdit = (section: SectionCapacity) => {
    setEditingId(section.id);
    setEditCapacity(section.max_capacity);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditCapacity(0);
  };

  const refreshCounts = async () => {
    setLoading(true);
    await loadSectionData();
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading section data...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Section Enrollment Counts</CardTitle>
          <Button 
            onClick={refreshCounts} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <h3 className="font-medium">
                  {section.level} - {section.strand_course} - Section {section.section}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Current Enrollment: {section.current_count} / {section.max_capacity}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge 
                  variant={section.current_count >= section.max_capacity ? "destructive" : "secondary"}
                >
                  {section.current_count >= section.max_capacity ? "Full" : "Available"}
                </Badge>
                
                {editingId === section.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={editCapacity}
                      onChange={(e) => setEditCapacity(parseInt(e.target.value) || 0)}
                      className="w-20"
                      min="1"
                    />
                    <Button
                      size="sm"
                      onClick={() => updateMaxCapacity(section.id, editCapacity)}
                    >
                      <Save className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelEdit}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEdit(section)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    Edit Capacity
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {sections.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No sections found. Sections are automatically created when students are assigned to them.
          </div>
        )}
      </CardContent>
    </Card>
  );
};