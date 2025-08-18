import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AddTeacherModalProps {
  onAddTeacher: (teacher: any) => void;
  excludeIds: string[];
  currentUser: {
    id: string;
    usn: string;
    fullName: string;
    strandCourse: string;
    section: string;
    level: 'shs' | 'college';
  };
}

const AddTeacherModal = ({ onAddTeacher, excludeIds, currentUser }: AddTeacherModalProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allTeachers, setAllTeachers] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");

  useEffect(() => {
    if (open) {
      loadAllTeachers();
    }
  }, [open]);

  const loadAllTeachers = async () => {
    try {
      const { data: teachers, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('is_active', true);
      if (error) {
        console.error('Error loading teachers:', error);
        return;
      }
      // Exclude teachers already added
      const filtered = (teachers || []).filter((t: any) => !excludeIds.includes(t.id));
      setAllTeachers(filtered);
    } catch (error) {
      console.error('Error loading teachers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher) {
      toast.error("Please select a teacher");
      return;
    }
    setIsSubmitting(true);
    try {
      const teacher = allTeachers.find(t => t.id === selectedTeacher);
      if (!teacher) {
        toast.error("Teacher not found");
        return;
      }
      // Await parent handler to add teacher and refresh list
      await onAddTeacher({ teacher, subjects: teacher.subjects });
      // Only close modal and reset after parent handler completes
      setSelectedTeacher("");
      setOpen(false);
    } catch (error) {
      console.error('Error adding teacher to evaluation list:', error);
      toast.error("Failed to add teacher to evaluation list");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Teacher
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Teacher to Section</DialogTitle>
          <DialogDescription>
            Select an existing teacher and assign them to your section.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="teacher-select">Select Teacher *</Label>
            <select
              id="teacher-select"
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full p-2 border rounded-md"
              disabled={isSubmitting}
            >
              <option value="">Choose a teacher...</option>
              {allTeachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name} - {teacher.department} ({teacher.subjects?.join(', ') || 'No subjects'})
                </option>
              ))}
            </select>
          </div>
          

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Teacher"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTeacherModal;