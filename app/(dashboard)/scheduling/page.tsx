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
import { Calendar, Clock, Users, AlertTriangle, CheckCircle, Send, Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ScheduleEntry {
  id: string;
  subject: {
    code: string;
    title: string;
    units: number;
    category: string;
  };
  instructor: {
    name: string;
    rank: string;
  };
  section: {
    name: string;
    yearLevel: number;
  };
  room: {
    code: string;
    building: string;
    capacity: number;
  };
  day: string;
  startTime: string;
  endTime: string;
  status: string;
}

interface TeachingLoad {
  instructorId: string;
  instructorName: string;
  currentUnits: number;
  standardLoad: number;
  isOverload: boolean;
  assignments: Array<{
    subjectCode: string;
    subjectTitle: string;
    units: number;
    section: string;
  }>;
}

export default function ChairmanSchedulingPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("draft");
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [teachingLoads, setTeachingLoads] = useState<TeachingLoad[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);
  const [availableInstructors, setAvailableInstructors] = useState<any[]>([]);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [availableSections, setAvailableSections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewEntryForm, setShowNewEntryForm] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(null);
  const [conflicts, setConflicts] = useState<any[]>([]);

  // Form state
  const [newEntry, setNewEntry] = useState({
    subjectId: "",
    instructorId: "",
    sectionId: "",
    roomId: "",
    day: "",
    startTime: "",
    endTime: "",
    justification: ""
  });

  useEffect(() => {
    if (session?.user) {
      loadData();
    }
  }, [session]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [entriesRes, loadsRes, subjectsRes, instructorsRes, roomsRes, sectionsRes] = await Promise.all([
        fetch("/api/schedule/draft"),
        fetch("/api/teaching-load/program"),
        fetch("/api/subjects/program"),
        fetch("/api/instructors/program"),
        fetch("/api/rooms/program"),
        fetch("/api/sections/program")
      ]);

      if (entriesRes.ok) {
        const entries = await entriesRes.json();
        setScheduleEntries(entries);
      }

      if (loadsRes.ok) {
        const loads = await loadsRes.json();
        setTeachingLoads(loads);
      }

      if (subjectsRes.ok) {
        const subjects = await subjectsRes.json();
        setAvailableSubjects(subjects);
      }

      if (instructorsRes.ok) {
        const instructors = await instructorsRes.json();
        setAvailableInstructors(instructors);
      }

      if (roomsRes.ok) {
        const rooms = await roomsRes.json();
        setAvailableRooms(rooms);
      }

      if (sectionsRes.ok) {
        const sections = await sectionsRes.json();
        setAvailableSections(sections);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load scheduling data");
    } finally {
      setIsLoading(false);
    }
  };

  const checkConflicts = async (entryData: any) => {
    try {
      const response = await fetch("/api/schedule/check-conflicts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entryData)
      });

      if (response.ok) {
        const conflicts = await response.json();
        setConflicts(conflicts);
        return conflicts;
      }
    } catch (error) {
      console.error("Error checking conflicts:", error);
    }
    return [];
  };

  const handleAddEntry = async () => {
    try {
      // Check for conflicts first
      const conflictCheck = await checkConflicts(newEntry);
      
      if (conflictCheck.length > 0) {
        toast.warning("Schedule conflicts detected. Please review before proceeding.");
        return;
      }

      const response = await fetch("/api/schedule/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEntry)
      });

      if (response.ok) {
        toast.success("Schedule entry added successfully");
        setShowNewEntryForm(false);
        setNewEntry({
          subjectId: "",
          instructorId: "",
          sectionId: "",
          roomId: "",
          day: "",
          startTime: "",
          endTime: "",
          justification: ""
        });
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to add schedule entry");
      }
    } catch (error) {
      console.error("Error adding entry:", error);
      toast.error("Failed to add schedule entry");
    }
  };

  const handleEditEntry = async (entryId: string, updates: any) => {
    try {
      const response = await fetch(`/api/schedule/draft/${entryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        toast.success("Schedule entry updated successfully");
        setSelectedEntry(null);
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update schedule entry");
      }
    } catch (error) {
      console.error("Error updating entry:", error);
      toast.error("Failed to update schedule entry");
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    try {
      const response = await fetch(`/api/schedule/draft/${entryId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        toast.success("Schedule entry deleted successfully");
        setSelectedEntry(null);
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to delete schedule entry");
      }
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast.error("Failed to delete schedule entry");
    }
  };

  const handleSubmitDraft = async () => {
    try {
      // Validate all entries have no conflicts
      const conflictResponse = await fetch("/api/schedule/validate-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: scheduleEntries })
      });

      if (!conflictResponse.ok) {
        const conflicts = await conflictResponse.json();
        toast.error("Please resolve all conflicts before submitting");
        return;
      }

      const response = await fetch("/api/schedule/draft/submit", {
        method: "POST"
      });

      if (response.ok) {
        toast.success("Schedule draft submitted to College Admin for review");
        setActiveTab("submitted");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to submit draft");
      }
    } catch (error) {
      console.error("Error submitting draft:", error);
      toast.error("Failed to submit draft");
    }
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
          <h1 className="text-2xl font-bold text-white">Schedule Drafting</h1>
          <p className="text-slate-400">Create and manage schedule drafts for your program</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowNewEntryForm(true)} className="bg-brand-teal hover:bg-brand-teal/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
          <Button 
            onClick={handleSubmitDraft} 
            disabled={scheduleEntries.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Send className="h-4 w-4 mr-2" />
            Submit Draft
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="draft" className="data-[state=active]:bg-slate-700">
            <Calendar className="h-4 w-4 mr-2" />
            Draft Schedule ({scheduleEntries.length})
          </TabsTrigger>
          <TabsTrigger value="teaching-load" className="data-[state=active]:bg-slate-700">
            <Users className="h-4 w-4 mr-2" />
            Teaching Load ({teachingLoads.length})
          </TabsTrigger>
          <TabsTrigger value="conflicts" className="data-[state=active]:bg-slate-700">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Conflicts ({conflicts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="draft" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Schedule Entries</CardTitle>
            </CardHeader>
            <CardContent>
              {scheduleEntries.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>
                    No schedule entries yet. Click &quot;Add Entry&quot; to start building your
                    schedule.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {scheduleEntries.map((entry) => (
                    <div key={entry.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-white">{entry.subject.code}</h3>
                            <Badge variant="secondary">{entry.subject.category}</Badge>
                            <Badge variant="outline">{entry.subject.units} units</Badge>
                          </div>
                          <p className="text-slate-300 mb-2">{entry.subject.title}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-slate-400">Instructor:</span>
                              <p className="text-white">{entry.instructor.name}</p>
                              <p className="text-slate-500 text-xs">{entry.instructor.rank}</p>
                            </div>
                            <div>
                              <span className="text-slate-400">Section:</span>
                              <p className="text-white">{entry.section.name} (Year {entry.section.yearLevel})</p>
                            </div>
                            <div>
                              <span className="text-slate-400">Room:</span>
                              <p className="text-white">{entry.room.code}</p>
                              <p className="text-slate-500 text-xs">{entry.room.building} • {entry.room.capacity} seats</p>
                            </div>
                            <div>
                              <span className="text-slate-400">Schedule:</span>
                              <p className="text-white">{entry.day}</p>
                              <p className="text-slate-500 text-xs">{entry.startTime} - {entry.endTime}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedEntry(entry)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teaching-load" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Teaching Load Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teachingLoads.map((load) => (
                  <div key={load.instructorId} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-white">{load.instructorName}</h3>
                        <p className="text-slate-400 text-sm">
                          {load.currentUnits} / {load.standardLoad} units
                        </p>
                      </div>
                      <Badge variant={getLoadStatusColor(load)}>
                        {getLoadStatusText(load)}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {load.assignments.map((assignment, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-slate-300">{assignment.subjectCode} - {assignment.subjectTitle}</span>
                          <span className="text-slate-400">{assignment.units} units • {assignment.section}</span>
                        </div>
                      ))}
                    </div>
                    {load.isOverload && (
                      <Alert className="mt-3 bg-amber-900/20 border-amber-800">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-amber-200">
                          Overload detected. Justification required for approval.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conflicts" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Schedule Conflicts</CardTitle>
            </CardHeader>
            <CardContent>
              {conflicts.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No conflicts detected. Your schedule is conflict-free!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {conflicts.map((conflict, index) => (
                    <Alert key={index} className="bg-red-900/20 border-red-800">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-red-200">
                        <strong>{conflict.type}:</strong> {conflict.description}
                        <div className="mt-2 text-sm">
                          {conflict.entries?.map((entry: any, i: number) => (
                            <div key={i} className="text-red-300">
                              • {entry.subjectCode} - {entry.instructorName} - {entry.day} {entry.startTime}-{entry.endTime}
                            </div>
                          ))}
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Entry Modal */}
      {showNewEntryForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-slate-900 border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-white">Add Schedule Entry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Select value={newEntry.subjectId} onValueChange={(value) => setNewEntry({...newEntry, subjectId: value})}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {availableSubjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.code} - {subject.title} ({subject.units} units)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="instructor">Instructor</Label>
                  <Select value={newEntry.instructorId} onValueChange={(value) => setNewEntry({...newEntry, instructorId: value})}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Select instructor" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {availableInstructors.map((instructor) => (
                        <SelectItem key={instructor.id} value={instructor.id}>
                          {instructor.name} ({instructor.rank})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="section">Section</Label>
                  <Select value={newEntry.sectionId} onValueChange={(value) => setNewEntry({...newEntry, sectionId: value})}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {availableSections.map((section) => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.name} (Year {section.yearLevel})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="room">Room</Label>
                  <Select value={newEntry.roomId} onValueChange={(value) => setNewEntry({...newEntry, roomId: value})}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {availableRooms.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.code} ({room.building} • {room.capacity} seats)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="day">Day</Label>
                  <Select value={newEntry.day} onValueChange={(value) => setNewEntry({...newEntry, day: value})}>
                    <SelectTrigger className="bg-slate-800 border-slate-700">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="MONDAY">Monday</SelectItem>
                      <SelectItem value="TUESDAY">Tuesday</SelectItem>
                      <SelectItem value="WEDNESDAY">Wednesday</SelectItem>
                      <SelectItem value="THURSDAY">Thursday</SelectItem>
                      <SelectItem value="FRIDAY">Friday</SelectItem>
                      <SelectItem value="SATURDAY">Saturday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={newEntry.startTime}
                    onChange={(e) => setNewEntry({...newEntry, startTime: e.target.value})}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={newEntry.endTime}
                    onChange={(e) => setNewEntry({...newEntry, endTime: e.target.value})}
                    className="bg-slate-800 border-slate-700"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="justification">Justification (if overload)</Label>
                <Textarea
                  id="justification"
                  value={newEntry.justification}
                  onChange={(e) => setNewEntry({...newEntry, justification: e.target.value})}
                  placeholder="Enter justification if this creates an overload..."
                  className="bg-slate-800 border-slate-700"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNewEntryForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddEntry} className="bg-brand-teal hover:bg-brand-teal/90">
                  Add Entry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
