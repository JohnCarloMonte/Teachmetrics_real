
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { X } from "lucide-react";

const FilterWordsManager = () => {
  const [filteredWords, setFilteredWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState("");

  useEffect(() => {
    // Load filtered words from localStorage
    const storedWords = localStorage.getItem("filteredWords");
    if (storedWords) {
      setFilteredWords(JSON.parse(storedWords));
    } else {
      // Set default keywords if none exist
      const defaultWords = ["excellent", "good", "great", "amazing", "poor", "bad", "terrible", "disappointing"];
      setFilteredWords(defaultWords);
      localStorage.setItem("filteredWords", JSON.stringify(defaultWords));
    }
  }, []);

  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newWord.trim()) {
      toast.error("Please enter a keyword");
      return;
    }
    
    const word = newWord.toLowerCase().trim();
    
    if (filteredWords.includes(word)) {
      toast.error("This keyword is already in the list");
      return;
    }
    
    const updatedWords = [...filteredWords, word];
    setFilteredWords(updatedWords);
    localStorage.setItem("filteredWords", JSON.stringify(updatedWords));
    setNewWord("");
    toast.success(`Added "${word}" to keyword list`);
  };

  const handleRemoveWord = (wordToRemove: string) => {
    const updatedWords = filteredWords.filter(word => word !== wordToRemove);
    setFilteredWords(updatedWords);
    localStorage.setItem("filteredWords", JSON.stringify(updatedWords));
    toast.success(`Removed "${wordToRemove}" from keyword list`);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Keywords Manager</h1>
      <p className="text-muted-foreground">
        Add positive and negative keywords to help automatically categorize student feedback as positive or negative.
      </p>
      
      <Card>
        <CardHeader>
          <CardTitle>Add New Keyword</CardTitle>
          <CardDescription>Add positive and negative words to help categorize student feedback</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddWord} className="flex space-x-2">
            <div className="flex-1">
              <Input 
                placeholder="Enter positive or negative keyword..." 
                value={newWord} 
                onChange={(e) => setNewWord(e.target.value)}
              />
            </div>
            <Button type="submit">Add Keyword</Button>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Current Keywords</CardTitle>
          <CardDescription>Keywords used for categorizing feedback sentiment</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Filter Word</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWords.length > 0 ? (
                filteredWords.map((word) => (
                  <TableRow key={word}>
                    <TableCell className="font-medium">{word}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleRemoveWord(word)}
                        className="h-8 w-8 p-0 text-red-500"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center">No keywords added yet</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
    </div>
  );
};

export default FilterWordsManager;
