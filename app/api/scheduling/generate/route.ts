import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth.config";
import { OptiCoreScheduler } from "@/lib/scheduling/scheduler";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const userRole = user.role;

    // Only allow admin users to generate schedules
    if (!['DOI', 'COLLEGE_ADMIN', 'CHAIRMAN_ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { program, generateMultiple = false, options = 1 } = await request.json();

    // Initialize scheduler
    const scheduler = new OptiCoreScheduler();
    await scheduler.initialize();

    let result;

    if (generateMultiple) {
      // Generate multiple options for comparison
      const results = await scheduler.generateMultipleOptions(program, options);
      result = {
        success: true,
        multipleOptions: true,
        options: results,
        bestOption: results[0], // First one is the best (sorted by fitness)
        statistics: scheduler.getStatistics()
      };
    } else {
      // Generate single best schedule
      const scheduleResult = await scheduler.generateSchedule(program);
      result = {
        success: scheduleResult.success,
        schedule: scheduleResult.schedule,
        message: scheduleResult.message,
        executionTime: scheduleResult.executionTime,
        iterations: scheduleResult.iterations,
        statistics: scheduler.getStatistics()
      };
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error("Error generating schedule:", error);
    return NextResponse.json({ 
      error: "Failed to generate schedule", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Initialize scheduler and get statistics
    const scheduler = new OptiCoreScheduler();
    await scheduler.initialize();
    const statistics = scheduler.getStatistics();

    return NextResponse.json({
      success: true,
      statistics,
      ready: true
    });

  } catch (error) {
    console.error("Error getting scheduler status:", error);
    return NextResponse.json({ 
      error: "Failed to get scheduler status", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
