import React, { useState, useEffect, useRef } from "react";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useReactToPrint } from 'react-to-print';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Printer, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Define a more comprehensive type for section data
type SectionData = {
  maxCount: number;
  signedUpCount: number;
  evaluatedCount: number;
};

// Define a type for the section counts mapping
type SectionCounts = {
  [section: string]: SectionData;
};

// Define the available sections (same as those in SignUpForm)
const availableSections = {
  'ABM': ['9-1', '9-2', '8-1'],
  'GAS': ['9-1', '9-2', '8-1'],
  'HUMSS': ['9-1', '9-2', '9-3', '9-4', '8-1', '8-2'],
  'TVL': ['9-1', '8-1'],
  'BSE': ['1-1', '2-1', '3-1', '4-1'],
  'BSIT': ['1-1', '2-1', '3-1', '4-1'],
  'ACT': ['1-1', '2-1'],
};

const SectionCountsDisplay = () => {
  const [sectionCounts, setSectionCounts] = useState<SectionCounts>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentSection, setCurrentSection] = useState("");
  const [sectionCount, setSectionCount] = useState("");
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load section counts from localStorage on component mount
    loadSectionData();
    
    // Set up event listener for user and evaluation updates
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);
  
  // Load section data and compute counts
  const loadSectionData = async () => {
    try {
      // Fetch all profiles from the database
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('strand_course, section, status');

      if (error) {
        console.error('Error fetching profiles:', error);
        toast.error('Failed to load section data');
        return;
      }

      // Initialize section data
      const sectionData: SectionCounts = {};

      // Count approved students per strand_course and section
      profiles.forEach((profile: { strand_course: string; section: string; status: string }) => {
        if (profile.strand_course && profile.section && profile.status === 'approved') {
          const sectionKey = `${profile.strand_course}-${profile.section}`;
          if (!sectionData[sectionKey]) {
            sectionData[sectionKey] = {
              maxCount: 0,
              signedUpCount: 0,
              evaluatedCount: 0
            };
          }
          sectionData[sectionKey].signedUpCount += 1;
        }
      });

      setSectionCounts(sectionData);
    } catch (error) {
      console.error('Error loading section data:', error);
      toast.error('Failed to load section data');
    }
  };
  
  // Initialize empty section data structure
  const initializeSectionData = () => {
    const initialCounts: SectionCounts = {};
    Object.entries(availableSections).forEach(([strand, sections]) => {
      sections.forEach(section => {
        const sectionKey = `${strand}-${section}`;
        initialCounts[sectionKey] = {
          maxCount: 0,
          signedUpCount: 0,
          evaluatedCount: 0
        };
      });
    });
    
    setSectionCounts(initialCounts);
    localStorage.setItem("sectionCounts", JSON.stringify(initialCounts));
  };
  
  // Handle localStorage changes (from other components)
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === "users" || event.key === "evaluations") {
      // Reload section data when users or evaluations change
      loadSectionData();
    }
  };

  // Function to handle editing a section count
  const handleEditSection = (section: string) => {
    const sectionData = sectionCounts[section];
    setCurrentSection(section);
    setSectionCount(sectionData.maxCount.toString());
    setShowEditDialog(true);
  };

  // Function to save edited section count
  const handleSaveEdit = () => {
    if (!currentSection) {
      toast.error("No section selected");
      return;
    }

    const count = parseInt(sectionCount);
    if (isNaN(count) || count < 0) {
      toast.error("Please enter a valid student count (0 or greater)");
      return;
    }

    const updatedCounts = {
      ...sectionCounts,
      [currentSection]: {
        ...sectionCounts[currentSection],
        maxCount: count
      }
    };

    localStorage.setItem("sectionCounts", JSON.stringify(updatedCounts));
    setSectionCounts(updatedCounts);
    setShowEditDialog(false);
    toast.success(`Updated ${currentSection} with maximum capacity of ${count} students`);
  };

  // Function to clear all section counts
  const clearSectionCounts = () => {
    // Reset counts to zero but keep the sections
    const resetCounts: SectionCounts = {};
    Object.keys(sectionCounts).forEach(section => {
      resetCounts[section] = {
        maxCount: 0,
        signedUpCount: 0,
        evaluatedCount: 0
      };
    });
    
    localStorage.setItem("sectionCounts", JSON.stringify(resetCounts));
    setSectionCounts(resetCounts);
    toast.success("All section counts reset to zero!");
  };

  // Function to filter section counts based on search query
  const filteredSectionCounts = Object.entries(sectionCounts)
    .filter(([section]) => section.toLowerCase().includes(searchQuery.toLowerCase()))
    .reduce((obj: SectionCounts, [section, data]) => {
      obj[section] = data;
      return obj;
    }, {});

  // Function to handle printing
  const handlePrint = useReactToPrint({
    documentTitle: "ACLC College Section Counts Report",
    onAfterPrint: () => toast.success("Report printed successfully!"),
    contentRef: tableRef
  });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Student Count</h1>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 mb-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex items-center space-x-4">
            <Label htmlFor="search">Search Section:</Label>
            <Input
              type="text"
              id="search"
              placeholder="Enter strand or section"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-60"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto" ref={tableRef}>
        <div className="print-only text-center mb-4">
          <h1 className="text-2xl font-bold">ACLC College of Daet</h1>
          <h2 className="text-xl">Student Count Report</h2>
          <p className="text-sm text-muted-foreground">Generated on {new Date().toLocaleDateString()}</p>
        </div>

        <Table>
          <TableCaption>Student distribution by strand and section in ACLC College of Daet</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Strand/Course - Section</TableHead>
              <TableHead className="text-right">Max Capacity</TableHead>
              <TableHead className="text-right">Approved Students</TableHead>
              <TableHead className="text-right">Evaluated</TableHead>
              <TableHead className="text-right w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.keys(filteredSectionCounts).length > 0 ? (
              Object.entries(filteredSectionCounts).map(([sectionKey, data]) => (
                <TableRow key={sectionKey}>
                  <TableCell className="font-medium">{sectionKey}</TableCell>
                  <TableCell className="text-right">{data.maxCount}</TableCell>
                  <TableCell className="text-right">
                    {data.signedUpCount}
                    {data.maxCount > 0 && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({Math.round((data.signedUpCount / data.maxCount) * 100)}%)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {data.evaluatedCount}
                    {data.signedUpCount > 0 && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({Math.round((data.evaluatedCount / data.signedUpCount) * 100)}%)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEditSection(sectionKey)}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  {Object.keys(sectionCounts).length === 0
                    ? "No section data available yet."
                    : "No sections found matching your search criteria."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Section Count Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Section Capacity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sectionName">Section Name</Label>
              <Input
                id="sectionName"
                value={currentSection}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentCount">Maximum Student Capacity</Label>
              <Input
                id="studentCount"
                type="number"
                placeholder="e.g., 30"
                value={sectionCount}
                onChange={(e) => setSectionCount(e.target.value)}
                min="0"
              />
              <p className="text-sm text-muted-foreground">
                Enter the maximum capacity for this section
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SectionCountsDisplay;
