"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SimpleSelect, SimpleSelectItem } from "@/components/ui/select-simple";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  Play, 
  Settings, 
  BarChart3, 
  Clock, 
  Users, 
  Building2, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Zap
} from "lucide-react";
import { toast } from "sonner";

interface SchedulingStatistics {
  courses: {
    total: number;
    byProgram: Record<string, number>;
    byType: Record<string, number>;
    labCourses: number;
  };
  faculty: {
    total: number;
    byRank: Record<string, number>;
    averageLoad: number;
  };
  rooms: {
    total: number;
    byType: Record<string, number>;
    byBuilding: Record<string, number>;
    averageCapacity: number;
  };
  sections: {
    total: number;
    byProgram: Record<string, number>;
    byYearLevel: Record<string, number>;
    totalStudents: number;
  };
}

interface ScheduleResult {
  success: boolean;
  schedule?: any;
  message?: string;
  executionTime: number;
  iterations: number;
  statistics?: SchedulingStatistics;
  multipleOptions?: boolean;
  options?: any[];
  bestOption?: any;
}

export default function AISchedulerPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("overview");
  const [statistics, setStatistics] = useState<SchedulingStatistics | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState("all");
  const [generationOptions, setGenerationOptions] = useState({
    generateMultiple: false,
    options: 3
  });
  const [lastResult, setLastResult] = useState<ScheduleResult | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const response = await fetch("/api/scheduling/generate");
      if (response.ok) {
        const data = await response.json();
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error("Error loading statistics:", error);
      toast.error("Failed to load scheduling statistics");
    }
  };

  const generateSchedule = async () => {
    setIsGenerating(true);
    setProgress(0);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const response = await fetch("/api/scheduling/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          program: selectedProgram === "all" ? undefined : selectedProgram,
          generateMultiple: generationOptions.generateMultiple,
          options: generationOptions.options
        })
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (response.ok) {
        const result: ScheduleResult = await response.json();
        setLastResult(result);
        
        if (result.success) {
          toast.success(`Schedule generated successfully! Fitness: ${result.schedule?.fitness?.toFixed(2) || 'N/A'}`);
        } else {
          toast.error(result.message || "Failed to generate schedule");
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to generate schedule");
      }
    } catch (error) {
      console.error("Error generating schedule:", error);
      toast.error("Failed to generate schedule");
    } finally {
      setIsGenerating(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const getAlgorithmInfo = () => ({
    name: "Hybrid Genetic Algorithm",
    description: "Combines Genetic Algorithm with Greedy initialization and Hill Climbing optimization",
    features: [
      "Intelligent conflict resolution",
      "Faculty qualification matching",
      "Room capacity optimization",
      "Workload balancing",
      "Prerequisite satisfaction",
      "Lab requirement enforcement"
    ],
    parameters: {
      populationSize: 50,
      generations: 100,
      mutationRate: 0.1,
      crossoverRate: 0.8,
      elitismRate: 0.2
    }
  });

  if (!statistics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-teal"></div>
      </div>
    );
  }

  const algorithm = getAlgorithmInfo();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Schedule Generator</h1>
          <p className="text-slate-400">Advanced timetabling using Genetic Algorithm optimization</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-brand-teal/10 text-brand-teal border-brand-teal/20">
            <Brain className="h-3 w-3 mr-1" />
            {algorithm.name}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="generator" className="data-[state=active]:bg-slate-700">
            <Play className="h-4 w-4 mr-2" />
            Generator
          </TabsTrigger>
          <TabsTrigger value="algorithm" className="data-[state=active]:bg-slate-700">
            <Settings className="h-4 w-4 mr-2" />
            Algorithm
          </TabsTrigger>
          <TabsTrigger value="results" className="data-[state=active]:bg-slate-700">
            <CheckCircle className="h-4 w-4 mr-2" />
            Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Data Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Total Courses</p>
                    <p className="text-2xl font-bold text-white">{statistics.courses.total}</p>
                    <p className="text-xs text-slate-500 mt-1">{statistics.courses.labCourses} lab courses</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-brand-teal" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Faculty Members</p>
                    <p className="text-2xl font-bold text-white">{statistics.faculty.total}</p>
                    <p className="text-xs text-slate-500 mt-1">{statistics.faculty.averageLoad.toFixed(1)} avg load</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Available Rooms</p>
                    <p className="text-2xl font-bold text-white">{statistics.rooms.total}</p>
                    <p className="text-xs text-slate-500 mt-1">{statistics.rooms.averageCapacity.toFixed(0)} avg capacity</p>
                  </div>
                  <Building2 className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Student Sections</p>
                    <p className="text-2xl font-bold text-white">{statistics.sections.total}</p>
                    <p className="text-xs text-slate-500 mt-1">{statistics.sections.totalStudents} total students</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-amber-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Program Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Courses by Program</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(statistics.courses.byProgram).map(([program, count]) => (
                    <div key={program} className="flex items-center justify-between">
                      <span className="text-slate-300">{program}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-brand-teal h-2 rounded-full" 
                            style={{ width: `${(count / statistics.courses.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-white text-sm w-8">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Faculty by Rank</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(statistics.faculty.byRank).map(([rank, count]) => (
                    <div key={rank} className="flex items-center justify-between">
                      <span className="text-slate-300 text-sm">{rank.replace(/_/g, ' ')}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-blue-400 h-2 rounded-full" 
                            style={{ width: `${(count / statistics.faculty.total) * 100}%` }}
                          />
                        </div>
                        <span className="text-white text-sm w-8">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="generator" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Schedule Generation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-300">Program</label>
                  <SimpleSelect 
                    value={selectedProgram} 
                    onValueChange={(value: string) => setSelectedProgram(value)}
                    placeholder="Select Program"
                  >
                    <SimpleSelectItem value="all">All Programs</SimpleSelectItem>
                    {Object.keys(statistics.courses.byProgram).map(program => (
                      <SimpleSelectItem key={program} value={program}>{program}</SimpleSelectItem>
                    ))}
                  </SimpleSelect>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300">Generation Options</label>
                  <SimpleSelect 
                    value={generationOptions.generateMultiple ? "multiple" : "single"} 
                    onValueChange={(value: string) => setGenerationOptions(prev => ({
                      ...prev,
                      generateMultiple: value === "multiple"
                    }))}
                    placeholder="Select Option"
                  >
                    <SimpleSelectItem value="single">Single Best Schedule</SimpleSelectItem>
                    <SimpleSelectItem value="multiple">Multiple Options</SimpleSelectItem>
                  </SimpleSelect>
                </div>
              </div>

              {generationOptions.generateMultiple && (
                <div>
                  <label className="text-sm font-medium text-slate-300">Number of Options</label>
                  <SimpleSelect 
                    value={generationOptions.options.toString()} 
                    onValueChange={(value: string) => setGenerationOptions(prev => ({
                      ...prev,
                      options: parseInt(value)
                    }))}
                    placeholder="Select Count"
                  >
                    <SimpleSelectItem value="2">2 Options</SimpleSelectItem>
                    <SimpleSelectItem value="3">3 Options</SimpleSelectItem>
                    <SimpleSelectItem value="5">5 Options</SimpleSelectItem>
                  </SimpleSelect>
                </div>
              )}

              {isGenerating && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Generating schedule...</span>
                    <span className="text-brand-teal">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              <div className="flex justify-center">
                <Button
                  onClick={generateSchedule}
                  disabled={isGenerating}
                  size="lg"
                  className="bg-brand-teal hover:bg-brand-teal/90 px-8"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {isGenerating ? "Generating..." : "Generate Schedule"}
                </Button>
              </div>

              {lastResult && (
                <Alert className={lastResult.success ? "bg-green-900/20 border-green-800" : "bg-red-900/20 border-red-800"}>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className={lastResult.success ? "text-green-200" : "text-red-200"}>
                    {lastResult.success 
                      ? `Schedule generated successfully in ${lastResult.executionTime}ms with ${lastResult.iterations} iterations`
                      : lastResult.message
                    }
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="algorithm" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Algorithm Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">{algorithm.name}</h3>
                <p className="text-slate-300 mb-4">{algorithm.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-md font-medium text-white mb-3">Key Features</h4>
                    <ul className="space-y-2">
                      {algorithm.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-slate-300">
                          <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-white mb-3">Parameters</h4>
                    <div className="space-y-2">
                      {Object.entries(algorithm.parameters).map(([param, value]) => (
                        <div key={param} className="flex justify-between text-slate-300">
                          <span className="capitalize">{param.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="text-brand-teal font-mono">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800 rounded-lg p-4">
                <h4 className="text-md font-medium text-white mb-2">How It Works</h4>
                <ol className="space-y-2 text-slate-300 text-sm">
                  <li>1. <strong>Initialization:</strong> Uses greedy algorithm to create intelligent starting population</li>
                  <li>2. <strong>Selection:</strong> Tournament selection preserves best solutions</li>
                  <li>3. <strong>Crossover:</strong> Two-point crossover combines parent schedules</li>
                  <li>4. <strong>Mutation:</strong> Random changes maintain diversity</li>
                  <li>5. <strong>Elitism:</strong> Best solutions always survive to next generation</li>
                  <li>6. <strong>Optimization:</strong> Hill climbing refines final solution</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {lastResult ? (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Generation Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {lastResult.success && lastResult.schedule ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-slate-800 rounded-lg p-4">
                        <p className="text-slate-400 text-sm">Fitness Score</p>
                        <p className="text-2xl font-bold text-brand-teal">
                          {lastResult.schedule.fitness?.toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-slate-800 rounded-lg p-4">
                        <p className="text-slate-400 text-sm">Conflicts</p>
                        <p className="text-2xl font-bold text-white">
                          {lastResult.schedule.metrics?.totalConflicts || 0}
                        </p>
                      </div>
                      <div className="bg-slate-800 rounded-lg p-4">
                        <p className="text-slate-400 text-sm">Execution Time</p>
                        <p className="text-2xl font-bold text-white">
                          {lastResult.executionTime}ms
                        </p>
                      </div>
                    </div>

                    {lastResult.schedule.metrics && (
                      <div className="bg-slate-800 rounded-lg p-4">
                        <h4 className="text-md font-medium text-white mb-3">Detailed Metrics</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-slate-400">Faculty Utilization:</span>
                            <p className="text-white">{lastResult.schedule.metrics.facultyUtilization.toFixed(1)}%</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Room Utilization:</span>
                            <p className="text-white">{lastResult.schedule.metrics.roomUtilization.toFixed(1)}%</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Workload Balance:</span>
                            <p className="text-white">{lastResult.schedule.metrics.workloadBalance.toFixed(1)}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Prerequisites:</span>
                            <p className="text-white">{lastResult.schedule.metrics.prerequisiteSatisfaction.toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-center">
                      <Button className="bg-brand-teal hover:bg-brand-teal/90">
                        Export Schedule
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Alert className="bg-red-900/20 border-red-800">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-red-200">
                      {lastResult.message || "Schedule generation failed"}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center text-slate-400">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No results yet. Generate a schedule to see results here.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
