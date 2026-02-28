"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Calendar, 
  Building2, 
  TrendingUp, 
  Download, 
  Filter,
  Search,
  Clock,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";

interface InstructorLoadReport {
  instructorId: string;
  instructorName: string;
  rank: string;
  college: string;
  program: string;
  currentUnits: number;
  standardLoad: number;
  overloadUnits: number;
  hourlyRate: number;
  totalCost: number;
  assignments: Array<{
    subjectCode: string;
    subjectTitle: string;
    units: number;
    category: string;
    section: string;
    day: string;
    time: string;
    room: string;
  }>;
  status: "NORMAL" | "NEAR_LIMIT" | "OVERLOAD";
}

interface StudentScheduleReport {
  sectionId: string;
  sectionName: string;
  programCode: string;
  programName: string;
  yearLevel: number;
  studentCount: number;
  schedule: Array<{
    subjectCode: string;
    subjectTitle: string;
    units: number;
    instructor: string;
    day: string;
    startTime: string;
    endTime: string;
    room: string;
    category: string;
  }>;
  totalUnits: number;
  gecUnits: number;
  majorUnits: number;
  labHours: number;
  lecHours: number;
}

interface RoomUtilizationReport {
  roomId: string;
  roomCode: string;
  building: string;
  capacity: number;
  type: string;
  utilization: number;
  totalHours: number;
  usedHours: number;
  availableHours: number;
  peakUsage: {
    day: string;
    time: string;
    utilization: number;
  };
  schedule: Array<{
    subjectCode: string;
    subjectTitle: string;
    instructor: string;
    section: string;
    day: string;
    startTime: string;
    endTime: string;
    utilization: number;
  }>;
}

export default function ComprehensiveReports() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("instructor-load");
  const [instructorReports, setInstructorReports] = useState<InstructorLoadReport[]>([]);
  const [studentReports, setStudentReports] = useState<StudentScheduleReport[]>([]);
  const [roomReports, setRoomReports] = useState<RoomUtilizationReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCollege, setFilterCollege] = useState("all");
  const [filterProgram, setFilterProgram] = useState("all");
  const [filterSemester, setFilterSemester] = useState("current");

  useEffect(() => {
    if (session?.user) {
      loadReportData();
    }
  }, [session]);

  const loadReportData = async () => {
    try {
      setIsLoading(true);
      const [instructorRes, studentRes, roomRes] = await Promise.all([
        fetch("/api/reports/instructor-load"),
        fetch("/api/reports/student-schedule"),
        fetch("/api/reports/room-utilization")
      ]);

      if (instructorRes.ok) {
        const instructors = await instructorRes.json();
        setInstructorReports(instructors);
      }

      if (studentRes.ok) {
        const students = await studentRes.json();
        setStudentReports(students);
      }

      if (roomRes.ok) {
        const rooms = await roomRes.json();
        setRoomReports(rooms);
      }
    } catch (error) {
      console.error("Error loading report data:", error);
      toast.error("Failed to load report data");
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.warning("No data to export");
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success(`Report exported as ${filename}.csv`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OVERLOAD": return "destructive";
      case "NEAR_LIMIT": return "warning";
      default: return "success";
    }
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return "text-red-400";
    if (utilization >= 75) return "text-amber-400";
    if (utilization >= 50) return "text-blue-400";
    return "text-green-400";
  };

  const calculateSummaryStats = () => {
    const totalInstructors = instructorReports.length;
    const totalOverloads = instructorReports.filter(i => i.status === "OVERLOAD").length;
    const totalCost = instructorReports.reduce((sum, i) => sum + i.totalCost, 0);
    const avgLoad = totalInstructors > 0 ? instructorReports.reduce((sum, i) => sum + i.currentUnits, 0) / totalInstructors : 0;

    return { totalInstructors, totalOverloads, totalCost, avgLoad };
  };

  const calculateRoomStats = () => {
    const totalRooms = roomReports.length;
    const avgUtilization = totalRooms > 0 ? roomReports.reduce((sum, r) => sum + r.utilization, 0) / totalRooms : 0;
    const highUtilization = roomReports.filter(r => r.utilization >= 80).length;
    const underutilized = roomReports.filter(r => r.utilization < 50).length;

    return { totalRooms, avgUtilization, highUtilization, underutilized };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-teal"></div>
      </div>
    );
  }

  const instructorStats = calculateSummaryStats();
  const roomStats = calculateRoomStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Comprehensive Reports</h1>
          <p className="text-slate-400">Detailed analytics for instructor load, student schedules, and room utilization</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterSemester} onValueChange={setFilterSemester}>
            <SelectTrigger className="bg-slate-800 border-slate-700 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="current">Current Semester</SelectItem>
              <SelectItem value="previous">Previous Semester</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="instructor-load" className="data-[state=active]:bg-slate-700">
            <Users className="h-4 w-4 mr-2" />
            Instructor Load
          </TabsTrigger>
          <TabsTrigger value="student-schedule" className="data-[state=active]:bg-slate-700">
            <Calendar className="h-4 w-4 mr-2" />
            Student Schedule
          </TabsTrigger>
          <TabsTrigger value="room-utilization" className="data-[state=active]:bg-slate-700">
            <Building2 className="h-4 w-4 mr-2" />
            Room Utilization
          </TabsTrigger>
        </TabsList>

        {/* Instructor Load Report */}
        <TabsContent value="instructor-load" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Total Instructors</p>
                    <p className="text-2xl font-bold text-white">{instructorStats.totalInstructors}</p>
                  </div>
                  <Users className="h-8 w-8 text-brand-teal" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Overloads</p>
                    <p className="text-2xl font-bold text-white">{instructorStats.totalOverloads}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-amber-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Avg Load</p>
                    <p className="text-2xl font-bold text-white">{instructorStats.avgLoad.toFixed(1)}</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Total Cost</p>
                    <p className="text-2xl font-bold text-white">₱{instructorStats.totalCost.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Table */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Instructor Load Details</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search instructors..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-800 border-slate-700 w-64"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportToCSV(instructorReports, "instructor-load-report")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-slate-400">Instructor</TableHead>
                    <TableHead className="text-slate-400">Rank</TableHead>
                    <TableHead className="text-slate-400">College/Program</TableHead>
                    <TableHead className="text-slate-400">Current Load</TableHead>
                    <TableHead className="text-slate-400">Standard Load</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Cost</TableHead>
                    <TableHead className="text-slate-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {instructorReports
                    .filter(instructor => 
                      instructor.instructorName.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((instructor) => (
                    <TableRow key={instructor.instructorId}>
                      <TableCell className="text-white font-medium">{instructor.instructorName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{instructor.rank}</Badge>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        <div>
                          <p>{instructor.college}</p>
                          <p className="text-xs text-slate-500">{instructor.program}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-white">{instructor.currentUnits} units</TableCell>
                      <TableCell className="text-slate-300">{instructor.standardLoad} units</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(instructor.status)}>
                          {instructor.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white">₱{instructor.totalCost.toLocaleString()}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Student Schedule Report */}
        <TabsContent value="student-schedule" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Student Schedule by Section</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToCSV(studentReports, "student-schedule-report")}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studentReports.map((section) => (
                  <div key={section.sectionId} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-white">
                          {section.programCode} {section.sectionName}
                        </h3>
                        <p className="text-slate-400">{section.programName} • Year {section.yearLevel}</p>
                        <p className="text-slate-500 text-sm">{section.studentCount} students</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-sm">Total Units</p>
                        <p className="text-2xl font-bold text-white">{section.totalUnits}</p>
                        <div className="flex gap-2 text-xs">
                          <span className="text-blue-400">{section.gecUnits} GEC</span>
                          <span className="text-green-400">{section.majorUnits} Major</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-slate-400 text-sm mb-1">Lecture Hours: {section.lecHours}</p>
                        <Progress value={(section.lecHours / (section.lecHours + section.labHours)) * 100} className="h-2" />
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm mb-1">Lab Hours: {section.labHours}</p>
                        <Progress value={(section.labHours / (section.lecHours + section.labHours)) * 100} className="h-2" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      {section.schedule.map((classItem, index) => (
                        <div key={index} className="bg-slate-700/50 rounded p-3 flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">{classItem.subjectCode}</span>
                              <Badge variant="secondary" className="text-xs">{classItem.category}</Badge>
                              <span className="text-slate-400 text-sm">{classItem.units} units</span>
                            </div>
                            <p className="text-slate-300 text-sm">{classItem.subjectTitle}</p>
                          </div>
                          <div className="text-right text-sm">
                            <p className="text-white">{classItem.day} {classItem.startTime}-{classItem.endTime}</p>
                            <p className="text-slate-400">{classItem.instructor} • {classItem.room}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Room Utilization Report */}
        <TabsContent value="room-utilization" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Total Rooms</p>
                    <p className="text-2xl font-bold text-white">{roomStats.totalRooms}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-brand-teal" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Avg Utilization</p>
                    <p className="text-2xl font-bold text-white">{roomStats.avgUtilization.toFixed(1)}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">High Utilization</p>
                    <p className="text-2xl font-bold text-white">{roomStats.highUtilization}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-amber-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Underutilized</p>
                    <p className="text-2xl font-bold text-white">{roomStats.underutilized}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Table */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Room Utilization Details</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToCSV(roomReports, "room-utilization-report")}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-slate-400">Room</TableHead>
                    <TableHead className="text-slate-400">Type</TableHead>
                    <TableHead className="text-slate-400">Capacity</TableHead>
                    <TableHead className="text-slate-400">Utilization</TableHead>
                    <TableHead className="text-slate-400">Hours Used</TableHead>
                    <TableHead className="text-slate-400">Peak Usage</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roomReports.map((room) => (
                    <TableRow key={room.roomId}>
                      <TableCell className="text-white font-medium">
                        <div>
                          <p>{room.roomCode}</p>
                          <p className="text-xs text-slate-500">{room.building}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{room.type}</Badge>
                      </TableCell>
                      <TableCell className="text-white">{room.capacity}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={room.utilization} className="h-2 w-16" />
                          <span className={`font-medium ${getUtilizationColor(room.utilization)}`}>
                            {room.utilization.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-white">{room.usedHours}h / {room.totalHours}h</TableCell>
                      <TableCell className="text-slate-300">
                        <div>
                          <p>{room.peakUsage.day}</p>
                          <p className="text-xs">{room.peakUsage.time} ({room.peakUsage.utilization.toFixed(1)}%)</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          room.utilization >= 80 ? "destructive" : 
                          room.utilization >= 50 ? "warning" : "success"
                        }>
                          {room.utilization >= 80 ? "High" : room.utilization >= 50 ? "Moderate" : "Low"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          View Schedule
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
