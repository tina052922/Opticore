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
  ArrowRight, 
  Users, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Send, 
  Eye, 
  Search,
  Filter,
  Bell,
  Archive
} from "lucide-react";
import { toast } from "sonner";

interface ChangeRequest {
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
  respondedBy?: string;
}

interface RequestSummary {
  total: number;
  pending: number;
  underReview: number;
  approved: number;
  rejected: number;
  urgent: number;
}

export default function ChangeRequestsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("incoming");
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [requestSummary, setRequestSummary] = useState<RequestSummary>({
    total: 0,
    pending: 0,
    underReview: 0,
    approved: 0,
    rejected: 0,
    urgent: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ChangeRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [responseText, setResponseText] = useState("");

  useEffect(() => {
    if (session?.user) {
      loadData();
    }
  }, [session]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/change-requests");
      
      if (response.ok) {
        const data = await response.json();
        setChangeRequests(data.requests);
        setRequestSummary(data.summary);
      } else {
        toast.error("Failed to load change requests");
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load change requests");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespondToRequest = async (requestId: string, action: "approve" | "reject" | "request_clarification") => {
    if (!responseText.trim() && action !== "approve") {
      toast.error("Please provide a response");
      return;
    }

    try {
      const status = action === "approve" ? "APPROVED" : action === "reject" ? "REJECTED" : "REQUIRE_CLARIFICATION";
      
      const response = await fetch(`/api/change-requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          response: responseText || "Request approved for implementation",
          status 
        })
      });

      if (response.ok) {
        toast.success(`Request ${action === "approve" ? "approved" : action === "reject" ? "rejected" : "clarification requested"}`);
        setShowResponseDialog(false);
        setResponseText("");
        setSelectedRequest(null);
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to respond to request");
      }
    } catch (error) {
      console.error("Error responding to request:", error);
      toast.error("Failed to respond to request");
    }
  };

  const handleImplementRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/change-requests/${requestId}/implement`, {
        method: "POST"
      });

      if (response.ok) {
        toast.success("Request marked as implemented");
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to implement request");
      }
    } catch (error) {
      console.error("Error implementing request:", error);
      toast.error("Failed to implement request");
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
                         request.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.requestedByName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || request.status === filterStatus;
    const matchesUrgency = filterUrgency === "all" || request.urgency === filterUrgency;
    return matchesSearch && matchesStatus && matchesUrgency;
  });

  const incomingRequests = filteredRequests.filter(r => r.receivedBy === session?.user?.id);
  const outgoingRequests = filteredRequests.filter(r => r.requestedBy === session?.user?.id);
  const implementedRequests = filteredRequests.filter(r => r.status === "IMPLEMENTED");

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
          <h1 className="text-2xl font-bold text-white">Change Request Management</h1>
          <p className="text-slate-400">Manage cross-college schedule change requests and approvals</p>
        </div>
        <div className="flex items-center gap-2">
          {requestSummary.urgent > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              <Bell className="h-3 w-3 mr-1" />
              {requestSummary.urgent} Urgent
            </Badge>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Requests</p>
                <p className="text-2xl font-bold text-white">{requestSummary.total}</p>
              </div>
              <ArrowRight className="h-8 w-8 text-brand-teal" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Pending</p>
                <p className="text-2xl font-bold text-amber-400">{requestSummary.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Under Review</p>
                <p className="text-2xl font-bold text-blue-400">{requestSummary.underReview}</p>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Approved</p>
                <p className="text-2xl font-bold text-green-400">{requestSummary.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Rejected</p>
                <p className="text-2xl font-bold text-red-400">{requestSummary.rejected}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="incoming" className="data-[state=active]:bg-slate-700">
            <ArrowRight className="h-4 w-4 mr-2" />
            Incoming ({incomingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="outgoing" className="data-[state=active]:bg-slate-700">
            <Send className="h-4 w-4 mr-2" />
            Outgoing ({outgoingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="implemented" className="data-[state=active]:bg-slate-700">
            <Archive className="h-4 w-4 mr-2" />
            Implemented ({implementedRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incoming" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Incoming Change Requests</CardTitle>
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
                  <Select value={filterUrgency} onValueChange={setFilterUrgency}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {incomingRequests.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <ArrowRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No incoming change requests.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {incomingRequests.map((request) => (
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
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setShowResponseDialog(true);
                                }}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-400 hover:text-red-300"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setShowResponseDialog(true);
                                }}
                              >
                                <AlertTriangle className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          {request.status === "APPROVED" && (
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleImplementRequest(request.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Implement
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-700">
                        <span>Requested: {new Date(request.createdAt).toLocaleDateString()}</span>
                        {request.respondedAt && (
                          <span>
                            Responded: {new Date(request.respondedAt).toLocaleDateString()}
                            {request.respondedBy && ` by ${request.respondedBy}`}
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

        <TabsContent value="outgoing" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Outgoing Change Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {outgoingRequests.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No outgoing change requests.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {outgoingRequests.map((request) => (
                    <div key={request.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-white">
                              To: {request.receivedByName}
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
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-700">
                        <span>Requested: {new Date(request.createdAt).toLocaleDateString()}</span>
                        {request.respondedAt && (
                          <span>
                            Responded: {new Date(request.respondedAt).toLocaleDateString()}
                            {request.respondedBy && ` by ${request.respondedBy}`}
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

        <TabsContent value="implemented" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Implemented Changes</CardTitle>
            </CardHeader>
            <CardContent>
              {implementedRequests.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No implemented changes yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {implementedRequests.map((request) => (
                    <div key={request.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700 opacity-75">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-white">
                              {request.requestedByName} → {request.receivedByName}
                            </h3>
                            <Badge variant="success">IMPLEMENTED</Badge>
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
                          {request.response && (
                            <div className="bg-green-900/20 border-green-800 rounded p-3 mt-2">
                              <p className="text-green-400 text-sm mb-1">Implementation Note:</p>
                              <p className="text-green-300 text-sm">{request.response}</p>
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
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-700">
                        <span>Requested: {new Date(request.createdAt).toLocaleDateString()}</span>
                        {request.respondedAt && (
                          <span>
                            Implemented: {new Date(request.respondedAt).toLocaleDateString()}
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
      </Tabs>

      {/* Response Dialog */}
      <Dialog open={showResponseDialog && selectedRequest} onOpenChange={setShowResponseDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Respond to Change Request</DialogTitle>
            <DialogDescription className="text-slate-400">
              Review and respond to the change request from {selectedRequest?.requestedByName}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-slate-800 rounded p-4">
                <h4 className="font-semibold text-white mb-2">Request Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Change Type:</span>
                    <p className="text-white">{selectedRequest.changeType}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Subject:</span>
                    <p className="text-white">{selectedRequest.subjectCode}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Section:</span>
                    <p className="text-white">{selectedRequest.sectionName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Time:</span>
                    <p className="text-white">{selectedRequest.timeSlot}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-slate-400 text-sm">Reason:</span>
                  <p className="text-slate-300 text-sm mt-1">{selectedRequest.reason}</p>
                </div>
                {selectedRequest.hasConflicts && (
                  <Alert className="mt-3 bg-red-900/20 border-red-800">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-red-200 text-sm">
                      {selectedRequest.conflictDetails}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              
              <div>
                <Label htmlFor="response">Your Response</Label>
                <Textarea
                  id="response"
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Enter your response..."
                  className="bg-slate-800 border-slate-700 min-h-[100px]"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowResponseDialog(false)}>
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  className="text-red-400 hover:text-red-300"
                  onClick={() => handleRespondToRequest(selectedRequest.id, "reject")}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  variant="outline"
                  className="text-amber-400 hover:text-amber-300"
                  onClick={() => handleRespondToRequest(selectedRequest.id, "request_clarification")}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Request Clarification
                </Button>
                <Button
                  onClick={() => handleRespondToRequest(selectedRequest.id, "approve")}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
