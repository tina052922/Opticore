"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Users, AlertTriangle, TrendingUp, Clock, FileText, Send } from "lucide-react";
import { toast } from "sonner";

interface TeachingLoad {
  instructorId: string;
  instructorName: string;
  rank: string;
  currentUnits: number;
  standardLoad: number;
  excessUnits: number;
  isOverload: boolean;
  hourlyRate: number;
  assignments: Array<{
    subjectCode: string;
    subjectTitle: string;
    units: number;
    section: string;
    category: string;
  }>;
  justification?: string;
}

interface OverloadRequest {
  id: string;
  instructorId: string;
  instructorName: string;
  totalUnits: number;
  standardLoad: number;
  excessUnits: number;
  justification: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: string;
  respondedAt?: string;
  respondedBy?: string;
}

export default function TeachingLoadPage() {
  const { data: session } = useSession();
  const [teachingLoads, setTeachingLoads] = useState<TeachingLoad[]>([]);
  const [overloadRequests, setOverloadRequests] = useState<OverloadRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInstructor, setSelectedInstructor] = useState<TeachingLoad | null>(null);
  const [showJustificationDialog, setShowJustificationDialog] = useState(false);
  const [justificationText, setJustificationText] = useState("");

  useEffect(() => {
    if (session?.user) {
      loadData();
    }
  }, [session]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [loadsRes, requestsRes] = await Promise.all([
        fetch("/api/teaching-load/program"),
        fetch("/api/teaching-load/overload-requests")
      ]);

      if (loadsRes.ok) {
        const loads = await loadsRes.json();
        setTeachingLoads(loads);
      }

      if (requestsRes.ok) {
        const requests = await requestsRes.json();
        setOverloadRequests(requests);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load teaching load data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitOverloadRequest = async (instructorId: string) => {
    if (!justificationText.trim()) {
      toast.error("Please provide a justification for the overload");
      return;
    }

    try {
      const response = await fetch("/api/teaching-load/overload-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instructorId,
          justification: justificationText
        })
      });

      if (response.ok) {
        toast.success("Overload justification submitted for approval");
        setShowJustificationDialog(false);
        setJustificationText("");
        setSelectedInstructor(null);
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to submit overload request");
      }
    } catch (error) {
      console.error("Error submitting overload request:", error);
      toast.error("Failed to submit overload request");
    }
  };

  const getLoadPercentage = (current: number, standard: number) => {
    return Math.min((current / standard) * 100, 100);
  };

  const getLoadStatusColor = (load: TeachingLoad) => {
    if (load.isOverload) return "destructive";
    if (load.currentUnits > load.standardLoad * 0.9) return "secondary";
    return "outline";
  };

  const getLoadStatusText = (load: TeachingLoad) => {
    if (load.isOverload) return "OVERLOAD";
    if (load.currentUnits > load.standardLoad * 0.9) return "NEAR LIMIT";
    return "NORMAL";
  };

  const getRequestStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED": return "default";
      case "REJECTED": return "destructive";
      default: return "secondary";
    }
  };

  const calculateTotalLoad = () => {
    return teachingLoads.reduce((total, load) => total + load.currentUnits, 0);
  };

  const calculateOverloadCount = () => {
    return teachingLoads.filter(load => load.isOverload).length;
  };

  const calculateEstimatedCost = () => {
    return teachingLoads.reduce((total, load) => {
      const regularHours = Math.min(load.currentUnits, load.standardLoad);
      const overloadHours = Math.max(0, load.currentUnits - load.standardLoad);
      return total + (regularHours * load.hourlyRate) + (overloadHours * load.hourlyRate * 1.25); // 25% premium for overload
    }, 0);
  };

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
          <h1 className="text-2xl font-bold text-white">Teaching Load Management</h1>
          <p className="text-slate-400">Monitor and manage faculty teaching loads according to CTU policies</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Faculty</p>
                <p className="text-2xl font-bold text-white">{teachingLoads.length}</p>
              </div>
              <Users className="h-8 w-8 text-brand-teal" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Units</p>
                <p className="text-2xl font-bold text-white">{calculateTotalLoad()}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Overloads</p>
                <p className="text-2xl font-bold text-white">{calculateOverloadCount()}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Est. Cost</p>
                <p className="text-2xl font-bold text-white">₱{calculateEstimatedCost().toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">
            <Users className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="details" className="data-[state=active]:bg-slate-700">
            <FileText className="h-4 w-4 mr-2" />
            Detailed Breakdown
          </TabsTrigger>
          <TabsTrigger value="overloads" className="data-[state=active]:bg-slate-700">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Overload Requests ({overloadRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Faculty Load Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teachingLoads.map((load) => (
                  <div key={load.instructorId} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-white">{load.instructorName}</h3>
                          <Badge variant="outline" className="text-xs">{load.rank}</Badge>
                          <Badge variant={getLoadStatusColor(load)}>
                            {getLoadStatusText(load)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-slate-400 text-sm">
                            {load.currentUnits} / {load.standardLoad} units
                          </span>
                          <span className="text-slate-400 text-sm">
                            ₱{load.hourlyRate}/hour
                          </span>
                          {load.isOverload && (
                            <span className="text-amber-400 text-sm font-medium">
                              +{load.excessUnits} units overload
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-32">
                          <Progress 
                            value={getLoadPercentage(load.currentUnits, load.standardLoad)} 
                            className="h-2"
                          />
                        </div>
                        <span className="text-slate-400 text-xs w-12">
                          {Math.round(getLoadPercentage(load.currentUnits, load.standardLoad))}%
                        </span>
                      </div>
                    </div>
                    
                    <Progress 
                      value={getLoadPercentage(load.currentUnits, load.standardLoad)} 
                      className={`h-2 ${load.isOverload ? 'bg-amber-900' : 'bg-slate-700'}`}
                    />
                    
                    {load.isOverload && (
                      <div className="mt-3 flex items-center justify-between">
                        <Alert className="bg-amber-900/20 border-amber-800 flex-1">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-amber-200 text-sm">
                            Overload requires justification. 
                            {load.justification ? " Justification on file." : " Submit justification for approval."}
                          </AlertDescription>
                        </Alert>
                        {!load.justification && (
                          <Dialog open={showJustificationDialog && selectedInstructor?.instructorId === load.instructorId} onOpenChange={setShowJustificationDialog}>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setSelectedInstructor(load)}
                                className="ml-3"
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Justify
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-900 border-slate-800">
                              <DialogHeader>
                                <DialogTitle className="text-white">Overload Justification</DialogTitle>
                                <DialogDescription className="text-slate-400">
                                  Provide justification for {load.instructorName}
                                  &apos;s overload of {load.excessUnits} units
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="justification">Justification</Label>
                                  <Textarea
                                    id="justification"
                                    value={justificationText}
                                    onChange={(e) => setJustificationText(e.target.value)}
                                    placeholder="Explain why this overload is necessary (e.g., course demand, specialized expertise, temporary coverage, etc.)"
                                    className="bg-slate-800 border-slate-700 min-h-[100px]"
                                  />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setShowJustificationDialog(false)}>
                                    Cancel
                                  </Button>
                                  <Button 
                                    onClick={() => handleSubmitOverloadRequest(load.instructorId)}
                                    className="bg-brand-teal hover:bg-brand-teal/90"
                                  >
                                    <Send className="h-4 w-4 mr-2" />
                                    Submit Justification
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Detailed Teaching Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {teachingLoads.map((load) => (
                  <div key={load.instructorId} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-white">{load.instructorName}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{load.rank}</Badge>
                        <Badge variant={getLoadStatusColor(load)}>
                          {load.currentUnits} units
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {load.assignments.map((assignment, index) => (
                        <div key={index} className="flex items-center justify-between bg-slate-700/50 rounded p-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">{assignment.subjectCode}</span>
                              <Badge variant="secondary" className="text-xs">{assignment.category}</Badge>
                              <span className="text-slate-400">{assignment.units} units</span>
                            </div>
                            <p className="text-slate-300 text-sm mt-1">{assignment.subjectTitle}</p>
                            <p className="text-slate-500 text-xs">Section: {assignment.section}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Total Load:</span>
                        <span className="font-medium text-white">{load.currentUnits} units</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Standard Load:</span>
                        <span className="font-medium text-white">{load.standardLoad} units</span>
                      </div>
                      {load.isOverload && (
                        <>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">Excess Load:</span>
                            <span className="font-medium text-amber-400">{load.excessUnits} units</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">Additional Cost:</span>
                            <span className="font-medium text-green-400">
                              ₱{(load.excessUnits * load.hourlyRate * 1.25).toLocaleString()}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overloads" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Overload Justification Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {overloadRequests.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No overload requests submitted yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {overloadRequests.map((request) => (
                    <div key={request.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-white">{request.instructorName}</h3>
                          <p className="text-slate-400 text-sm">
                            {request.totalUnits} / {request.standardLoad} units ({request.excessUnits} excess)
                          </p>
                        </div>
                        <Badge variant={getRequestStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </div>
                      <div className="bg-slate-700/50 rounded p-3 mb-3">
                        <p className="text-slate-300 text-sm">{request.justification}</p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Requested: {new Date(request.requestedAt).toLocaleDateString()}</span>
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
      </Tabs>
    </div>
  );
}
