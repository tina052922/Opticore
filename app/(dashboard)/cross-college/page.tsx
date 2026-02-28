"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Building2, 
  Users, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Send, 
  Eye, 
  ArrowRight,
  Search,
  Filter
} from "lucide-react";
import { toast } from "sonner";

interface CollegeSchedule {
  collegeCode: string;
  collegeName: string;
  totalEntries: number;
  conflicts: number;
  vacantSlots: number;
  lastUpdated: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED";
}

interface CrossCollegeRequest {
  id: string;
  requestedBy: string;
  requestedByName: string;
  receivedBy: string;
  receivedByName: string;
  changeType: string;
  subjectCode: string;
  sectionName: string;
  roomCode: string;
  timeSlot: string;
  reason: string;
  urgency: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  hasConflicts: boolean;
  conflictDetails: string;
  status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "REQUIRE_CLARIFICATION" | "IMPLEMENTED";
  response: string;
  createdAt: string;
  respondedAt?: string;
}

interface VacantSlot {
  collegeCode: string;
  collegeName: string;
  roomCode: string;
  day: string;
  startTime: string;
  endTime: string;
  capacity: number;
  availableUntil: string;
}

export default function CrossCollegePage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("overview");
  const [collegeSchedules, setCollegeSchedules] = useState<CollegeSchedule[]>([]);
  const [changeRequests, setChangeRequests] = useState<CrossCollegeRequest[]>([]);
  const [vacantSlots, setVacantSlots] = useState<VacantSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CrossCollegeRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Form state for new request
  const [newRequest, setNewRequest] = useState({
    targetCollegeId: "",
    changeType: "",
    subjectCode: "",
    sectionName: "",
    roomCode: "",
    timeSlot: "",
    reason: "",
    urgency: "NORMAL" as const,
    proposedSolution: ""
  });

  useEffect(() => {
    if (session?.user) {
      loadData();
    }
  }, [session]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [schedulesRes, requestsRes, vacantRes] = await Promise.all([
        fetch("/api/cross-college/schedules"),
        fetch("/api/cross-college/requests"),
        fetch("/api/cross-college/vacant-slots")
      ]);

      if (schedulesRes.ok) {
        const schedules = await schedulesRes.json();
        setCollegeSchedules(schedules);
      }

      if (requestsRes.ok) {
        const requests = await requestsRes.json();
        setChangeRequests(requests);
      }

      if (vacantRes.ok) {
        const vacant = await vacantRes.json();
        setVacantSlots(vacant);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load cross-college data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitChangeRequest = async () => {
    try {
      const response = await fetch("/api/cross-college/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRequest)
      });

      if (response.ok) {
        toast.success("Change request submitted successfully");
        setShowNewRequestDialog(false);
        setNewRequest({
          targetCollegeId: "",
          changeType: "",
          subjectCode: "",
          sectionName: "",
          roomCode: "",
          timeSlot: "",
          reason: "",
          urgency: "NORMAL",
          proposedSolution: ""
        });
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to submit change request");
      }
    } catch (error) {
      console.error("Error submitting request:", error);
      toast.error("Failed to submit change request");
    }
  };

  const handleRespondToRequest = async (requestId: string, response: string, action: "approve" | "reject" | "request_clarification") => {
    try {
      const status = action === "approve" ? "APPROVED" : action === "reject" ? "REJECTED" : "REQUIRE_CLARIFICATION";
      
      const apiResponse = await fetch(`/api/cross-college/request/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response, status })
      });

      if (apiResponse.ok) {
        toast.success(`Request ${action === "approve" ? "approved" : action === "reject" ? "rejected" : "clarification requested"}`);
        setSelectedRequest(null);
        loadData();
      } else {
        const error = await apiResponse.json();
        toast.error(error.message || "Failed to respond to request");
      }
    } catch (error) {
      console.error("Error responding to request:", error);
      toast.error("Failed to respond to request");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED": return "success";
      case "REJECTED": return "destructive";
      case "UNDER_REVIEW": return "warning";
      case "REQUIRE_CLARIFICATION": return "warning";
      case "IMPLEMENTED": return "success";
      default: return "secondary";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "URGENT": return "destructive";
      case "HIGH": return "warning";
      case "NORMAL": return "secondary";
      default: return "outline";
    }
  };

  const filteredRequests = changeRequests.filter(request => {
    const matchesSearch = request.subjectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.sectionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || request.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-teal"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Cross-College Coordination</h1>
          <p className="text-slate-400">Manage inter-college schedule coordination and change requests</p>
        </div>
        <Button onClick={() => setShowNewRequestDialog(true)} className="bg-brand-teal hover:bg-brand-teal/90">
          <Send className="h-4 w-4 mr-2" />
          Send Change Request
        </Button>
      </div>

      {/* College Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {collegeSchedules.map((college) => (
          <Card key={college.collegeCode} className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Building2 className="h-8 w-8 text-brand-teal" />
                <Badge variant={getStatusColor(college.status)}>
                  {college.status}
                </Badge>
              </div>
              <h3 className="font-semibold text-white mb-2">{college.collegeName}</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Schedule Entries:</span>
                  <span className="text-white">{college.totalEntries}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Conflicts:</span>
                  <span className={college.conflicts > 0 ? "text-red-400" : "text-green-400"}>
                    {college.conflicts}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Vacant Slots:</span>
                  <span className="text-blue-400">{college.vacantSlots}</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-700">
                <p className="text-xs text-slate-500">
                  Updated: {new Date(college.lastUpdated).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">
            <Building2 className="h-4 w-4 mr-2" />
            College Overview
          </TabsTrigger>
          <TabsTrigger value="requests" className="data-[state=active]:bg-slate-700">
            <ArrowRight className="h-4 w-4 mr-2" />
            Change Requests ({filteredRequests.length})
          </TabsTrigger>
          <TabsTrigger value="vacant" className="data-[state=active]:bg-slate-700">
            <Calendar className="h-4 w-4 mr-2" />
            Vacant Slots ({vacantSlots.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">College Schedule Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-slate-400">College</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Entries</TableHead>
                    <TableHead className="text-slate-400">Conflicts</TableHead>
                    <TableHead className="text-slate-400">Vacant Slots</TableHead>
                    <TableHead className="text-slate-400">Last Updated</TableHead>
                    <TableHead className="text-slate-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collegeSchedules.map((college) => (
                    <TableRow key={college.collegeCode}>
                      <TableCell className="text-white">{college.collegeName}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(college.status)}>
                          {college.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white">{college.totalEntries}</TableCell>
                      <TableCell>
                        <span className={college.conflicts > 0 ? "text-red-400" : "text-green-400"}>
                          {college.conflicts}
                        </span>
                      </TableCell>
                      <TableCell className="text-blue-400">{college.vacantSlots}</TableCell>
                      <TableCell className="text-slate-400">
                        {new Date(college.lastUpdated).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Change Requests</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search requests..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-800 border-slate-700 w-64"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredRequests.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <ArrowRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No change requests found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRequests.map((request) => (
                    <div key={request.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-white">
                              {request.requestedByName} → {request.receivedByName}
                            </h3>
                            <Badge variant={getStatusColor(request.status)}>
                              {request.status}
                            </Badge>
                            <Badge variant={getUrgencyColor(request.urgency)}>
                              {request.urgency}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                            <div>
                              <span className="text-slate-400">Change Type:</span>
                              <p className="text-white">{request.changeType}</p>
                            </div>
                            <div>
                              <span className="text-slate-400">Subject:</span>
                              <p className="text-white">{request.subjectCode}</p>
                            </div>
                            <div>
                              <span className="text-slate-400">Section:</span>
                              <p className="text-white">{request.sectionName}</p>
                            </div>
                            <div>
                              <span className="text-slate-400">Time:</span>
                              <p className="text-white">{request.timeSlot}</p>
                            </div>
                          </div>
                          <div className="bg-slate-700/50 rounded p-3">
                            <p className="text-slate-400 text-sm mb-1">Reason:</p>
                            <p className="text-slate-300 text-sm">{request.reason}</p>
                          </div>
                          {request.proposedSolution && (
                            <div className="bg-slate-700/50 rounded p-3 mt-2">
                              <p className="text-slate-400 text-sm mb-1">Proposed Solution:</p>
                              <p className="text-slate-300 text-sm">{request.proposedSolution}</p>
                            </div>
                          )}
                          {request.hasConflicts && (
                            <Alert className="mt-3 bg-red-900/20 border-red-800">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription className="text-red-200 text-sm">
                                {request.conflictDetails}
                              </AlertDescription>
                            </Alert>
                          )}
                          {request.response && (
                            <div className="bg-slate-700/50 rounded p-3 mt-2">
                              <p className="text-slate-400 text-sm mb-1">Response:</p>
                              <p className="text-slate-300 text-sm">{request.response}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {request.status === "PENDING" && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleRespondToRequest(request.id, "Approved for implementation", "approve")}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-400 hover:text-red-300"
                                onClick={() => handleRespondToRequest(request.id, "Cannot accommodate at this time", "reject")}
                              >
                                <AlertTriangle className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-700">
                        <span>Requested: {new Date(request.createdAt).toLocaleDateString()}</span>
                        {request.respondedAt && (
                          <span>
                            Responded: {new Date(request.respondedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vacant" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Vacant Slots Across Colleges</CardTitle>
            </CardHeader>
            <CardContent>
              {vacantSlots.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No vacant slots available.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {vacantSlots.map((slot, index) => (
                    <div key={index} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-white">{slot.collegeName}</h3>
                            <Badge variant="outline">{slot.roomCode}</Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-slate-400">Day:</span>
                              <p className="text-white">{slot.day}</p>
                            </div>
                            <div>
                              <span className="text-slate-400">Time:</span>
                              <p className="text-white">{slot.startTime} - {slot.endTime}</p>
                            </div>
                            <div>
                              <span className="text-slate-400">Capacity:</span>
                              <p className="text-white">{slot.capacity} seats</p>
                            </div>
                            <div>
                              <span className="text-slate-400">Available Until:</span>
                              <p className="text-white">{new Date(slot.availableUntil).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <ArrowRight className="h-4 w-4 mr-1" />
                          Request
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Change Request Dialog */}
      <Dialog open={showNewRequestDialog} onOpenChange={setShowNewRequestDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Send Cross-College Change Request</DialogTitle>
            <DialogDescription className="text-slate-400">
              Request changes to another college's schedule
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="targetCollege">Target College</Label>
                <Select value={newRequest.targetCollegeId} onValueChange={(value) => setNewRequest({...newRequest, targetCollegeId: value})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue placeholder="Select college" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="cas">College of Arts and Sciences</SelectItem>
                    <SelectItem value="cafe">College of Agriculture and Food Engineering</SelectItem>
                    <SelectItem value="coed">College of Education</SelectItem>
                    <SelectItem value="chtm">College of Hospitality and Tourism Management</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="changeType">Change Type</Label>
                <Select value={newRequest.changeType} onValueChange={(value) => setNewRequest({...newRequest, changeType: value})}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="ROOM_CHANGE">Room Change</SelectItem>
                    <SelectItem value="TIME_CHANGE">Time Change</SelectItem>
                    <SelectItem value="INSTRUCTOR_CHANGE">Instructor Change</SelectItem>
                    <SelectItem value="SCHEDULE_CONFLICT">Schedule Conflict</SelectItem>
                    <SelectItem value="CROSS_COLLEGE_INTEGRATION">Cross-College Integration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subjectCode">Subject Code</Label>
                <Input
                  id="subjectCode"
                  value={newRequest.subjectCode}
                  onChange={(e) => setNewRequest({...newRequest, subjectCode: e.target.value})}
                  placeholder="e.g., GEC-PC"
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div>
                <Label htmlFor="sectionName">Section</Label>
                <Input
                  id="sectionName"
                  value={newRequest.sectionName}
                  onChange={(e) => setNewRequest({...newRequest, sectionName: e.target.value})}
                  placeholder="e.g., BSIT 1A"
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div>
                <Label htmlFor="roomCode">Room Code</Label>
                <Input
                  id="roomCode"
                  value={newRequest.roomCode}
                  onChange={(e) => setNewRequest({...newRequest, roomCode: e.target.value})}
                  placeholder="e.g., LR 101"
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div>
                <Label htmlFor="timeSlot">Time Slot</Label>
                <Input
                  id="timeSlot"
                  value={newRequest.timeSlot}
                  onChange={(e) => setNewRequest({...newRequest, timeSlot: e.target.value})}
                  placeholder="e.g., MWF 8:00-9:00"
                  className="bg-slate-800 border-slate-700"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="urgency">Urgency</Label>
              <Select value={newRequest.urgency} onValueChange={(value: any) => setNewRequest({...newRequest, urgency: value})}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="reason">Reason for Change</Label>
              <Textarea
                id="reason"
                value={newRequest.reason}
                onChange={(e) => setNewRequest({...newRequest, reason: e.target.value})}
                placeholder="Explain why this change is necessary..."
                className="bg-slate-800 border-slate-700 min-h-[100px]"
              />
            </div>
            <div>
              <Label htmlFor="proposedSolution">Proposed Solution (Optional)</Label>
              <Textarea
                id="proposedSolution"
                value={newRequest.proposedSolution}
                onChange={(e) => setNewRequest({...newRequest, proposedSolution: e.target.value})}
                placeholder="Suggest how this change can be accommodated..."
                className="bg-slate-800 border-slate-700 min-h-[80px]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewRequestDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitChangeRequest} className="bg-brand-teal hover:bg-brand-teal/90">
                <Send className="h-4 w-4 mr-2" />
                Send Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
