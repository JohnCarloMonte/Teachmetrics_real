import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Key, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PasswordResetRequest {
  id: string;
  email: string;
  usn: string;
  full_name: string;
  request_date: string;
  status: string;
}

const PasswordResetRequests = () => {
  const [requests, setRequests] = useState<PasswordResetRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<PasswordResetRequest | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('password_reset_requests')
        .select('*')
        .order('request_date', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading password reset requests:', error);
      toast.error('Failed to load password reset requests');
    }
  };

  const handlePasswordReset = async () => {
    if (!selectedRequest || !newPassword) {
      toast.error("Please enter a new password");
      return;
    }

    try {
      // Update the user's password in the profiles table
      const { error: passwordError } = await supabase
        .from('profiles')
        .update({ password: newPassword })
        .eq('phone_number', selectedRequest.email)
        .eq('usn', selectedRequest.usn);

      if (passwordError) throw passwordError;

      // Mark the request as completed
      const { error: requestError } = await supabase
        .from('password_reset_requests')
        .update({ status: 'completed' })
        .eq('id', selectedRequest.id);

      if (requestError) throw requestError;

      toast.success(`Password updated for ${selectedRequest.full_name}. New password: ${newPassword}`);
      setDialogOpen(false);
      setNewPassword("");
      setSelectedRequest(null);
      loadRequests();
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Failed to reset password');
    }
  };

  const dismissRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('password_reset_requests')
        .update({ status: 'dismissed' })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Request dismissed');
      loadRequests();
    } catch (error) {
      console.error('Error dismissing request:', error);
      toast.error('Failed to dismiss request');
    }
  };

  const deleteRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('password_reset_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Request deleted');
      loadRequests();
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error('Failed to delete request');
    }
  };

  const pendingRequests = requests.filter(req => req.status === 'pending');

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Password Reset Requests</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Password Reset Requests</CardTitle>
          <CardDescription>
            Students who have requested password resets. You can set new passwords and email them to the students.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>USN</TableHead>
                  <TableHead>Request Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.length > 0 ? (
                  pendingRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.full_name}</TableCell>
                      <TableCell>{request.email}</TableCell>
                      <TableCell>{request.usn}</TableCell>
                      <TableCell>{new Date(request.request_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedRequest(request)}
                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                              >
                                <Key className="h-4 w-4 mr-1" />
                                Reset Password
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reset Password</DialogTitle>
                                <DialogDescription>
                                  Set a new password for {request.full_name} ({request.email})
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="newPassword">New Password</Label>
                                  <Input
                                    id="newPassword"
                                    type="text"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                  />
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Password will be displayed in plain text so you can email it to the student
                                  </p>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                    Cancel
                                  </Button>
                                  <Button onClick={handlePasswordReset}>
                                    Update Password
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => dismissRequest(request.id)}
                            className="text-orange-600 border-orange-200 hover:bg-orange-50"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Dismiss
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      No pending password reset requests
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* All Requests History */}
      <Card>
        <CardHeader>
          <CardTitle>All Password Reset Requests</CardTitle>
          <CardDescription>
            Complete history of all password reset requests including completed and dismissed ones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>USN</TableHead>
                  <TableHead>Request Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.length > 0 ? (
                  requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.full_name}</TableCell>
                      <TableCell>{request.email}</TableCell>
                      <TableCell>{request.usn}</TableCell>
                      <TableCell>{new Date(request.request_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => deleteRequest(request.id)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      No password reset requests found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PasswordResetRequests;