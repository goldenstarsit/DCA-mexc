import { db } from '@/server/database';
import { DcaLevelRepository } from '@/server/dca/DcaLevelRepository.js';
import { DcaLevelService } from '@/server/dca/DcaLevelService.js';

const service = new DcaLevelService(
  new DcaLevelRepository(db)
);

export async function GET() {
  try {
    return Response.json({
      success: true,
      levels: service.getAll(),
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const level = service.create(body);

    return Response.json(
      {
        success: true,
        level,
      },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 400 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();

    if (!Number.isInteger(body.level) || body.level <= 0) {
      return Response.json(
        {
          success: false,
          error: 'level must be a positive integer',
        },
        { status: 400 }
      );
    }

    const { level, ...patch } = body;

    const updated = service.update(level, patch);

    return Response.json({
      success: true,
      level: updated,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 400 }
    );
  }
}
